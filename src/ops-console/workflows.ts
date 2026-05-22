import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { getConsoleTask, upsertConsoleTask } from './task-registry';
import { listConsoleRuns } from './artifact-store';
import type { ConsoleRunSummary, ConsoleTaskRecord } from './types';

type TriggerStoryInput = {
  topic: string;
  platform?: 'douyin' | 'xiaohongshu' | 'tiktok';
  style?: string;
  dryRun?: boolean;
};

type TriggerExecutionPackInput = {
  count: number;
  platform?: 'douyin' | 'xiaohongshu' | 'tiktok';
  diverseOnly?: boolean;
};

type TriggerDailyInput = {
  dryRun?: boolean;
};

type SpawnedTaskProcess = {
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
  on(event: 'error', listener: (error: Error) => void): unknown;
  on(event: 'close', listener: (exitCode: number | null) => void): unknown;
};

export interface WorkflowRunDependencies {
  spawnProcess?: (task: ConsoleTaskRecord, env: NodeJS.ProcessEnv) => SpawnedTaskProcess;
  listRuns?: () => ConsoleRunSummary[];
  getTask?: (taskId: string) => ConsoleTaskRecord | undefined;
  upsertTask?: (task: ConsoleTaskRecord) => ConsoleTaskRecord;
}

function createTaskId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function createTask(input: Omit<ConsoleTaskRecord, 'createdAt'>): ConsoleTaskRecord {
  return {
    ...input,
    createdAt: new Date().toISOString()
  };
}

function defaultSpawnProcess(task: ConsoleTaskRecord, env: NodeJS.ProcessEnv): SpawnedTaskProcess {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(command, ['run', task.command, '--', ...task.args], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function expectedRunKind(task: ConsoleTaskRecord): ConsoleRunSummary['kind'] {
  return task.workflow;
}

function normalizeRunDir(runDir: string): string {
  return path.isAbsolute(runDir) ? path.normalize(runDir) : path.resolve(process.cwd(), runDir);
}

export function extractRunDirFromOutput(output: string): string | undefined {
  const matchers = [
    /"runDir"\s*:\s*"([^"]+)"/g,
    /\brunDir:\s*'([^']+)'/g,
    /\brunDir:\s*"([^"]+)"/g,
    /^\s*output:\s*([^\s]+)\s*$/gm
  ];

  let lastMatch: string | undefined;
  for (const matcher of matchers) {
    for (const match of output.matchAll(matcher)) {
      lastMatch = match[1];
    }
  }
  return lastMatch;
}

function snapshotRunIds(runs: ConsoleRunSummary[]): Set<string> {
  return new Set(runs.map((run) => run.id));
}

export function resolveLatestRunIdForTask(
  task: ConsoleTaskRecord,
  runsBefore: Set<string>,
  stdout: string,
  stderr: string,
  runsAfter: ConsoleRunSummary[]
): string | undefined {
  const runDir = extractRunDirFromOutput(`${stdout}\n${stderr}`);
  if (runDir) {
    const normalizedRunDir = normalizeRunDir(runDir);
    const matchedRun = runsAfter.find((run) => path.normalize(run.runDir) === normalizedRunDir);
    if (matchedRun) {
      return matchedRun.id;
    }
  }

  return runsAfter
    .filter((run) => !runsBefore.has(run.id) && run.kind === expectedRunKind(task))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]?.id;
}

export function runConsoleTask(
  task: ConsoleTaskRecord,
  env: NodeJS.ProcessEnv = process.env,
  dependencies: WorkflowRunDependencies = {}
): ConsoleTaskRecord {
  const spawnProcess = dependencies.spawnProcess ?? defaultSpawnProcess;
  const listRuns = dependencies.listRuns ?? (() => listConsoleRuns());
  const getTask = dependencies.getTask ?? ((taskId: string) => getConsoleTask(taskId));
  const upsertTask = dependencies.upsertTask ?? ((record: ConsoleTaskRecord) => upsertConsoleTask(record));
  const runsBefore = snapshotRunIds(listRuns());
  const child = spawnProcess(task, env);

  const runningTask: ConsoleTaskRecord = {
    ...task,
    status: 'running',
    startedAt: new Date().toISOString()
  };
  upsertTask(runningTask);

  let stdout = '';
  let stderr = '';
  let finalized = false;
  child.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const finalize = (exitCode: number | null, spawnError?: unknown) => {
    if (finalized) {
      return;
    }
    finalized = true;
    const latest = getTask(task.id) ?? runningTask;
    const succeeded = exitCode === 0;
    const latestRunId = succeeded ? resolveLatestRunIdForTask(task, runsBefore, stdout, stderr, listRuns()) : latest.latestRunId;
    upsertTask({
      ...latest,
      status: succeeded ? 'succeeded' : 'failed',
      finishedAt: new Date().toISOString(),
      stdoutPreview: stdout.slice(-2000),
      stderrPreview: stderr.slice(-2000),
      error: succeeded ? undefined : String(spawnError ?? (stderr || stdout || 'Task failed')).slice(-500),
      exitCode: exitCode ?? undefined,
      latestRunId
    });
  };

  child.on('error', (error) => {
    finalize(1, error);
  });
  child.on('close', (exitCode) => {
    finalize(exitCode);
  });

  return runningTask;
}

export function triggerStoryWorkflow(input: TriggerStoryInput, dependencies: WorkflowRunDependencies = {}): ConsoleTaskRecord {
  const args = ['--topic', input.topic];
  if (input.platform) args.push('--platform', input.platform);
  if (input.style) args.push('--style', input.style);
  if (input.dryRun) args.push('--dry-run');

  const task = createTask({
    id: createTaskId('story'),
    workflow: 'story',
    label: `Story · ${input.topic}`,
    status: 'queued',
    command: 'story',
    args,
    params: input
  });
  upsertConsoleTask(task);
  return runConsoleTask(task, process.env, dependencies);
}

export function triggerExecutionPackWorkflow(input: TriggerExecutionPackInput, dependencies: WorkflowRunDependencies = {}): ConsoleTaskRecord {
  const args = [String(input.count), input.platform ?? 'douyin'];
  if (input.diverseOnly) args.push('--diverse-only');

  const task = createTask({
    id: createTaskId('execution-pack'),
    workflow: 'execution-pack',
    label: `Execution Pack · ${input.platform ?? 'douyin'}`,
    status: 'queued',
    command: 'topics:assets',
    args,
    params: input
  });
  upsertConsoleTask(task);
  return runConsoleTask(task, process.env, dependencies);
}

export function triggerDailyWorkflow(input: TriggerDailyInput, dependencies: WorkflowRunDependencies = {}): ConsoleTaskRecord {
  const args: string[] = [];
  const env = {
    ...process.env,
    ...(input.dryRun ? { DRY_RUN: 'true' } : {})
  };

  const task = createTask({
    id: createTaskId('daily'),
    workflow: 'daily',
    label: `Daily Job${input.dryRun ? ' · dry-run' : ''}`,
    status: 'queued',
    command: 'daily',
    args,
    params: input
  });
  upsertConsoleTask(task);
  return runConsoleTask(task, env, dependencies);
}

export function getConsoleStaticDir(): string {
  return path.resolve(process.cwd(), 'src', 'ops-console', 'public');
}
