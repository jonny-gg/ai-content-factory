import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { DashboardData, ArtifactKind, ArtifactRef, ConsoleRunDetail, ConsoleRunKind, ConsoleRunSummary, RuntimeReadiness } from './types';
import { listConsoleTasks } from './task-registry';

type JsonValue = Record<string, unknown>;
export interface OpsConsoleStoreOptions {
  repoRoot?: string;
}

function resolveRepoRoot(options: OpsConsoleStoreOptions = {}): string {
  return path.resolve(options.repoRoot ?? process.cwd());
}

function readJson(filePath: string): JsonValue {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonValue;
}

function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function toRelative(filePath: string, repoRoot: string): string {
  return path.relative(repoRoot, filePath) || path.basename(filePath);
}

function detectArtifactKind(filePath: string): ArtifactKind {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext && exists(filePath) && fs.statSync(filePath).isDirectory()) return 'directory';
  if (ext === '.json') return 'json';
  if (ext === '.md') return 'markdown';
  if (ext === '.txt') return 'text';
  if (ext === '.mp3' || ext === '.wav') return 'audio';
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') return 'image';
  return 'other';
}

function collectArtifacts(runDir: string, repoRoot: string): ArtifactRef[] {
  if (!exists(runDir)) return [];
  const artifacts: ArtifactRef[] = [];
  const stack = [runDir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      artifacts.push({
        name: entry.name,
        path: fullPath,
        relativePath: toRelative(fullPath, repoRoot),
        kind: detectArtifactKind(fullPath)
      });
    }
  }
  return artifacts.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function buildRuntimeReadiness(): RuntimeReadiness {
  const ffmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return {
    llmConfigured: Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY),
    hfConfigured: Boolean(process.env.HF_API_KEY),
    ffmpegAvailable: ffmpeg.status === 0
  };
}

function createSummary(input: {
  id: string;
  kind: ConsoleRunKind;
  title: string;
  subtitle?: string;
  createdAt: string;
  status?: 'success' | 'failed' | 'unknown';
  runDir: string;
  topic?: string;
  platform?: string;
  count?: number;
}, repoRoot: string): ConsoleRunSummary {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    subtitle: input.subtitle,
    createdAt: input.createdAt,
    status: input.status ?? 'success',
    runDir: input.runDir,
    relativeRunDir: toRelative(input.runDir, repoRoot),
    topic: input.topic,
    platform: input.platform,
    count: input.count
  };
}

function loadTextArtifacts(artifacts: ArtifactRef[]): Array<{ label: string; path: string; content: string }> {
  return artifacts
    .filter((artifact) => artifact.kind === 'markdown' || artifact.kind === 'text')
    .slice(0, 8)
    .map((artifact) => ({
      label: artifact.name,
      path: artifact.relativePath,
      content: fs.readFileSync(artifact.path, 'utf8')
    }));
}

function detailFromSummary(summary: ConsoleRunSummary, payload: JsonValue, repoRoot: string): ConsoleRunDetail {
  const artifacts = collectArtifacts(summary.runDir, repoRoot);
  return {
    ...summary,
    artifacts,
    payload,
    viewer: {
      textFiles: loadTextArtifacts(artifacts)
    }
  };
}

function scanExecutionPacks(outputDir: string, repoRoot: string): ConsoleRunDetail[] {
  if (!exists(outputDir)) return [];
  return fs.readdirSync(outputDir)
    .filter((name) => name.startsWith('execution-pack-'))
    .map((name) => {
      const runDir = path.join(outputDir, name);
      const summaryPath = path.join(runDir, 'summary.json');
      const payload = readJson(summaryPath);
      return detailFromSummary(createSummary({
        id: name,
        kind: 'execution-pack',
        title: `Execution Pack · ${String(payload.platform ?? 'unknown')}`,
        subtitle: `${String(payload.count ?? 0)} items`,
        createdAt: String(payload.generatedAt ?? new Date(0).toISOString()),
        runDir,
        platform: typeof payload.platform === 'string' ? payload.platform : undefined,
        count: typeof payload.count === 'number' ? payload.count : undefined
      }, repoRoot), payload, repoRoot);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function scanDailyRuns(outputRoot: string, repoRoot: string): ConsoleRunDetail[] {
  if (!exists(outputRoot)) return [];
  const results: ConsoleRunDetail[] = [];
  for (const dateDir of fs.readdirSync(outputRoot)) {
    const fullDateDir = path.join(outputRoot, dateDir);
    if (!fs.statSync(fullDateDir).isDirectory()) continue;
    for (const name of fs.readdirSync(fullDateDir)) {
      if (!name.startsWith('daily-run-')) continue;
      const runDir = path.join(fullDateDir, name);
      const metaPath = path.join(runDir, 'run-meta.json');
      const errorPath = path.join(runDir, 'run-error.json');
      if (exists(metaPath)) {
        const payload = readJson(metaPath);
        results.push(detailFromSummary(createSummary({
          id: name,
          kind: 'daily',
          title: 'Daily Job',
          subtitle: typeof payload.dryRun === 'boolean' ? `dryRun=${String(payload.dryRun)}` : undefined,
          createdAt: String(payload.startedAt ?? new Date(0).toISOString()),
          status: 'success',
          runDir
        }, repoRoot), payload, repoRoot));
      } else if (exists(errorPath)) {
        const payload = readJson(errorPath);
        results.push(detailFromSummary(createSummary({
          id: name,
          kind: 'daily',
          title: 'Daily Job',
          subtitle: 'failed',
          createdAt: String(payload.failedAt ?? new Date(0).toISOString()),
          status: 'failed',
          runDir
        }, repoRoot), payload, repoRoot));
      }
    }
  }
  return results.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function scanWeeklyPackages(outputDir: string, repoRoot: string): ConsoleRunDetail[] {
  const root = path.join(outputDir, 'weekly-packages');
  if (!exists(root)) return [];
  return fs.readdirSync(root)
    .flatMap((name) => {
      const runDir = path.join(root, name);
      const planPath = path.join(runDir, 'weekly-plan.json');
      if (!exists(planPath)) {
        return [];
      }
      const payload = readJson(planPath);
      return [detailFromSummary(createSummary({
        id: name,
        kind: 'weekly-package',
        title: `Weekly Package · ${String(payload.niche ?? 'unknown')}`,
        subtitle: `${String(payload.platform ?? 'unknown')} / ${String(payload.days ?? 0)} days`,
        createdAt: name.split('_').at(-1) ? new Date(Number(name.split('_').at(-1))).toISOString() : new Date(0).toISOString(),
        runDir,
        topic: typeof payload.niche === 'string' ? payload.niche : undefined,
        platform: typeof payload.platform === 'string' ? payload.platform : undefined,
        count: Array.isArray(payload.items) ? payload.items.length : undefined
      }, repoRoot), payload, repoRoot)];
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function scanWeeklyMatrix(outputDir: string, repoRoot: string): ConsoleRunDetail[] {
  const root = path.join(outputDir, 'weekly-matrix');
  if (!exists(root)) return [];
  const results: ConsoleRunDetail[] = [];
  for (const platformDir of fs.readdirSync(root)) {
    const runDir = path.join(root, platformDir);
    const summaryPath = path.join(runDir, 'matrix-summary.json');
    if (!exists(summaryPath)) continue;
    const payload = readJson(summaryPath);
    results.push(detailFromSummary(createSummary({
      id: platformDir,
      kind: 'weekly-matrix',
      title: `Weekly Matrix · ${platformDir.split('_')[0] ?? 'unknown'}`,
      subtitle: Array.isArray(payload.results) ? `${payload.results.length} niches` : undefined,
      createdAt: platformDir.split('_').at(-1) ? new Date(Number(platformDir.split('_').at(-1))).toISOString() : new Date(0).toISOString(),
      runDir,
      platform: platformDir.split('_')[0],
      count: Array.isArray(payload.results) ? payload.results.length : undefined
    }, repoRoot), payload, repoRoot));
  }
  return results.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function scanStoryRuns(outputRoot: string, repoRoot: string): ConsoleRunDetail[] {
  const runsRoot = path.join(outputRoot, 'runs');
  if (!exists(runsRoot)) return [];
  return fs.readdirSync(runsRoot)
    .map((name) => {
      const runDir = path.join(runsRoot, name);
      const storyPath = path.join(runDir, 'story-package.json');
      const payload = readJson(storyPath);
      return detailFromSummary(createSummary({
        id: name,
        kind: 'story',
        title: String(payload.title ?? name),
        subtitle: typeof payload.summary === 'string' ? payload.summary : undefined,
        createdAt: String(payload.createdAt ?? new Date(0).toISOString()),
        runDir,
        topic: typeof payload.topic === 'string' ? payload.topic : undefined,
        platform: typeof payload.platform === 'string' ? payload.platform : undefined,
        count: Array.isArray(payload.scenes) ? payload.scenes.length : undefined
      }, repoRoot), payload, repoRoot);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function listConsoleRunDetails(options: OpsConsoleStoreOptions = {}): ConsoleRunDetail[] {
  const repoRoot = resolveRepoRoot(options);
  const outputDir = path.join(repoRoot, 'output');
  const datedOutputRoot = outputDir;
  return [
    ...scanStoryRuns(datedOutputRoot, repoRoot),
    ...scanExecutionPacks(outputDir, repoRoot),
    ...scanDailyRuns(datedOutputRoot, repoRoot),
    ...scanWeeklyPackages(outputDir, repoRoot),
    ...scanWeeklyMatrix(outputDir, repoRoot)
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function listConsoleRuns(options: OpsConsoleStoreOptions = {}): ConsoleRunSummary[] {
  return listConsoleRunDetails(options).map(({ artifacts: _artifacts, payload: _payload, ...summary }) => summary);
}

export function getConsoleRunDetail(runId: string, options: OpsConsoleStoreOptions = {}): ConsoleRunDetail | undefined {
  return listConsoleRunDetails(options).find((run) => run.id === runId);
}

export function getDashboardData(options: OpsConsoleStoreOptions = {}): DashboardData {
  const runs = listConsoleRuns(options);
  const latestByKind: DashboardData['latestByKind'] = {};
  const countsByKind: DashboardData['countsByKind'] = {};
  for (const run of runs) {
    countsByKind[run.kind] = (countsByKind[run.kind] ?? 0) + 1;
    if (!latestByKind[run.kind]) {
      latestByKind[run.kind] = run;
    }
  }

  return {
    runtime: buildRuntimeReadiness(),
    recentRuns: runs.slice(0, 12),
    latestByKind,
    failedRuns: runs.filter((run) => run.status === 'failed').slice(0, 10),
    countsByKind,
    tasks: listConsoleTasks(options).slice(0, 20)
  };
}
