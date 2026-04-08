import path from 'path';
import { execSync } from 'child_process';
import { loadRuntimeConfig } from './load-runtime-config';
import { ensureDir, writeJsonFile } from './env-config';
import { logStage, withRetry } from './pipeline-utils';

export interface DailyJobRunResult {
  runId: string;
  runDir: string;
  dryRun: boolean;
  estimatedCostUsd: number;
}

function runCommand(
  stage: string,
  command: string,
  options: {
    timeoutMs: number;
    dryRun: boolean;
    retries: number;
    baseDelayMs: number;
  }
): Promise<{ stdout: string; status: 'ok' | 'skipped' }> {
  logStage(stage, 'running command', { command, timeoutMs: options.timeoutMs, dryRun: options.dryRun });

  if (options.dryRun) {
    return Promise.resolve({ stdout: '[dry-run skipped]', status: 'skipped' });
  }

  return withRetry(stage, async () => {
    const stdout = execSync(command, {
      stdio: 'pipe',
      timeout: options.timeoutMs,
      encoding: 'utf8'
    });
    return { stdout, status: 'ok' as const };
  }, {
    retries: options.retries,
    baseDelayMs: options.baseDelayMs
  });
}

async function sendTelegramMessage(
  message: string,
  options: {
    telegramBotToken?: string;
    telegramChatId?: string;
    dryRun: boolean;
    retries: number;
    baseDelayMs: number;
  }
): Promise<{ skipped: true } | unknown> {
  if (!options.telegramBotToken || !options.telegramChatId) {
    logStage('notify', 'telegram config missing, skip notify');
    return { skipped: true };
  }

  if (options.dryRun) {
    logStage('notify', 'dry-run enabled, skip telegram send');
    return { skipped: true };
  }

  const url = `https://api.telegram.org/bot${options.telegramBotToken}/sendMessage`;
  return withRetry('notify', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: options.telegramChatId,
        text: message
      })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(JSON.stringify(json));
    }
    return json;
  }, {
    retries: options.retries,
    baseDelayMs: options.baseDelayMs
  });
}

function collectCostSummary(runMeta: { costs?: Array<{ estimatedCostUsd?: number }> }): { totalEstimatedCostUsd: number; records: Array<{ estimatedCostUsd?: number }> } {
  const records = runMeta.costs || [];
  const totalEstimatedCostUsd = records.reduce((sum, item) => sum + Number(item.estimatedCostUsd || 0), 0);
  return {
    records,
    totalEstimatedCostUsd: Number(totalEstimatedCostUsd.toFixed(6))
  };
}

export async function runDailyJob(env: NodeJS.ProcessEnv = process.env): Promise<DailyJobRunResult> {
  const config = loadRuntimeConfig({ allowMissingLlmApiKey: true, env });
  const startedAt = new Date().toISOString();
  const runId = String(Date.now());
  const runDir = ensureDir(path.join(config.outputDir, `daily-run-${runId}`));
  const meta: {
    runId: string;
    startedAt: string;
    dryRun: boolean;
    costs: Array<{ stage: string; model?: string; estimatedCostUsd?: number; notes?: string }>;
    steps: Array<{ stage: string; status: string; stdoutPreview: string }>;
  } = {
    runId,
    startedAt,
    dryRun: config.dryRun,
    costs: [],
    steps: []
  };

  try {
    logStage('bootstrap', 'daily job started', { runId, runDir, dryRun: config.dryRun });

    const commandOptions = {
      timeoutMs: config.requestTimeoutMs,
      dryRun: config.dryRun,
      retries: config.maxRetries,
      baseDelayMs: config.retryBaseDelayMs
    };

    const monetized = await runCommand('topic-pick', 'npm run topics:monetize:diverse', commandOptions);
    meta.steps.push({ stage: 'topic-pick', status: monetized.status, stdoutPreview: monetized.stdout.slice(0, 500) });

    const assets = await runCommand('topics-assets', 'npm run topics:assets -- 3 douyin --diverse-only', commandOptions);
    meta.steps.push({ stage: 'topics-assets', status: assets.status, stdoutPreview: assets.stdout.slice(0, 500) });

    const summary = await runCommand('summary', 'npm run topics:summary', commandOptions);
    meta.steps.push({ stage: 'summary', status: summary.status, stdoutPreview: summary.stdout.slice(0, 500) });

    meta.costs.push({
      stage: 'llm',
      model: config.llmModel,
      estimatedCostUsd: config.dryRun ? 0 : 0,
      notes: 'Placeholder cost record; wire token usage from service layer for precise accounting.'
    });

    const costSummary = collectCostSummary(meta);
    const finishedAt = new Date().toISOString();
    const result = { ...meta, finishedAt, costSummary };

    writeJsonFile(path.join(runDir, 'run-meta.json'), result);

    const report = [
      'AI内容工厂日报任务完成',
      `runId: ${runId}`,
      `dryRun: ${config.dryRun}`,
      `output: ${runDir}`,
      `model: ${config.llmModel}`,
      `estimatedCostUsd: ${costSummary.totalEstimatedCostUsd}`
    ].join('\n');

    logStage('complete', 'daily job finished', { runDir, estimatedCostUsd: costSummary.totalEstimatedCostUsd });
    await sendTelegramMessage(report, {
      telegramBotToken: config.telegramBotToken,
      telegramChatId: config.telegramChatId,
      dryRun: config.dryRun,
      retries: config.maxRetries,
      baseDelayMs: config.retryBaseDelayMs
    });

    return {
      runId,
      runDir,
      dryRun: config.dryRun,
      estimatedCostUsd: costSummary.totalEstimatedCostUsd
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failure = {
      runId,
      failedAt,
      error: String(error)
    };
    writeJsonFile(path.join(runDir, 'run-error.json'), failure);
    logStage('fatal', 'daily job failed', failure);
    await sendTelegramMessage(`AI内容工厂日报任务失败\nrunId: ${runId}\nerror: ${String(error)}`, {
      telegramBotToken: config.telegramBotToken,
      telegramChatId: config.telegramChatId,
      dryRun: config.dryRun,
      retries: config.maxRetries,
      baseDelayMs: config.retryBaseDelayMs
    });
    throw error;
  }
}

if (require.main === module) {
  runDailyJob().catch(() => {
    process.exitCode = 1;
  });
}
