require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 45000);
const DEFAULT_MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);
const DEFAULT_RETRY_BASE_DELAY_MS = Number(process.env.RETRY_BASE_DELAY_MS || 1500);
const DRY_RUN = ['1', 'true', 'yes', 'on'].includes(String(process.env.DRY_RUN || '').toLowerCase());
const OUTPUT_ROOT = process.env.OUTPUT_DIR || path.join('output', new Date().toISOString().slice(0, 10));

function logStage(stage, message, extra) {
  if (extra) {
    console.log(`[${stage}] ${message}`, extra);
    return;
  }
  console.log(`[${stage}] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(stage, fn, retries = DEFAULT_MAX_RETRIES, baseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      logStage(stage, 'retrying after failure', { attempt, error: String(error) });
      await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function runCommand(stage, command) {
  logStage(stage, 'running command', { command, timeoutMs: DEFAULT_TIMEOUT_MS, dryRun: DRY_RUN });
  if (DRY_RUN) {
    return { stdout: '[dry-run skipped]', status: 'skipped' };
  }

  return withRetry(stage, async () => {
    const stdout = execSync(command, {
      stdio: 'pipe',
      timeout: DEFAULT_TIMEOUT_MS,
      encoding: 'utf8'
    });
    return { stdout, status: 'ok' };
  });
}

async function sendTelegramMessage(message) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    logStage('notify', 'telegram env missing, skip notify');
    return { skipped: true };
  }

  if (DRY_RUN) {
    logStage('notify', 'dry-run enabled, skip telegram send');
    return { skipped: true };
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  return withRetry('notify', async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message
        }),
        signal: controller.signal
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(JSON.stringify(json));
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  });
}

function collectCostSummary(runMeta) {
  const records = runMeta.costs || [];
  const totalEstimatedCostUsd = records.reduce((sum, item) => sum + Number(item.estimatedCostUsd || 0), 0);
  return {
    records,
    totalEstimatedCostUsd: Number(totalEstimatedCostUsd.toFixed(6))
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const runId = String(Date.now());
  const runDir = ensureDir(path.join(OUTPUT_ROOT, `daily-run-${runId}`));
  const meta = {
    runId,
    startedAt,
    dryRun: DRY_RUN,
    costs: [],
    steps: []
  };

  try {
    logStage('bootstrap', 'daily job started', { runId, runDir, dryRun: DRY_RUN });

    const monetized = await runCommand('topic-pick', 'npm run topics:monetize:diverse');
    meta.steps.push({ stage: 'topic-pick', status: monetized.status, stdoutPreview: monetized.stdout.slice(0, 500) });

    const assets = await runCommand('topics-assets', 'npm run topics:assets -- 3 douyin --diverse-only');
    meta.steps.push({ stage: 'topics-assets', status: assets.status, stdoutPreview: assets.stdout.slice(0, 500) });

    const summary = await runCommand('summary', 'npm run topics:summary');
    meta.steps.push({ stage: 'summary', status: summary.status, stdoutPreview: summary.stdout.slice(0, 500) });

    meta.costs.push({
      stage: 'llm',
      model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-5.4',
      estimatedCostUsd: DRY_RUN ? 0 : 0,
      notes: 'daily-job.js currently records placeholders; wire token usage in service layer for precise accounting.'
    });

    const costSummary = collectCostSummary(meta);
    const finishedAt = new Date().toISOString();
    const result = { ...meta, finishedAt, costSummary };

    writeJson(path.join(runDir, 'run-meta.json'), result);

    const report = [
      `AI内容工厂日报任务完成`,
      `runId: ${runId}`,
      `dryRun: ${DRY_RUN}`,
      `output: ${runDir}`,
      `estimatedCostUsd: ${costSummary.totalEstimatedCostUsd}`
    ].join('\n');

    logStage('complete', 'daily job finished', { runDir, estimatedCostUsd: costSummary.totalEstimatedCostUsd });
    await sendTelegramMessage(report);
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failure = {
      runId,
      failedAt,
      error: String(error)
    };
    writeJson(path.join(runDir, 'run-error.json'), failure);
    logStage('fatal', 'daily job failed', failure);
    await sendTelegramMessage(`AI内容工厂日报任务失败\nrunId: ${runId}\nerror: ${String(error)}`);
    process.exitCode = 1;
  }
}

main();
