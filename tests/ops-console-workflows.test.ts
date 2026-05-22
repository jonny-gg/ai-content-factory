import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { extractRunDirFromOutput, resolveLatestRunIdForTask, runConsoleTask } from '../src/ops-console/workflows';
import type { ConsoleRunSummary, ConsoleTaskRecord } from '../src/ops-console/types';

class FakeChildProcess extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();

  writeStdout(chunk: string): void {
    this.stdout.write(chunk);
  }

  writeStderr(chunk: string): void {
    this.stderr.write(chunk);
  }

  close(exitCode: number): void {
    this.stdout.end();
    this.stderr.end();
    this.emit('close', exitCode);
  }
}

function createTask(overrides: Partial<ConsoleTaskRecord> = {}): ConsoleTaskRecord {
  return {
    id: 'task-1',
    workflow: 'execution-pack',
    label: 'Execution Pack · douyin',
    status: 'queued',
    createdAt: '2026-05-13T00:00:00.000Z',
    command: 'topics:assets',
    args: ['2', 'douyin', '--diverse-only'],
    params: { count: 2, platform: 'douyin', diverseOnly: true },
    ...overrides
  };
}

function createRun(overrides: Partial<ConsoleRunSummary> = {}): ConsoleRunSummary {
  return {
    id: 'execution-pack-2',
    kind: 'execution-pack',
    title: 'Execution Pack · douyin',
    createdAt: '2026-05-13T00:05:00.000Z',
    status: 'success',
    runDir: '/tmp/output/execution-pack-2',
    relativeRunDir: 'output/execution-pack-2',
    ...overrides
  };
}

async function flushEvents(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function run(): Promise<void> {
  assert.equal(
    extractRunDirFromOutput('{"ok":true,"runDir":"/tmp/output/execution-pack-2"}'),
    '/tmp/output/execution-pack-2'
  );
  assert.equal(
    extractRunDirFromOutput("[complete] daily job finished { runDir: 'output/2026-05-13/daily-run-1' }"),
    'output/2026-05-13/daily-run-1'
  );
  assert.equal(
    extractRunDirFromOutput('AI内容工厂日报任务完成\noutput: output/2026-05-13/daily-run-2\n'),
    'output/2026-05-13/daily-run-2'
  );

  const parsedRunId = resolveLatestRunIdForTask(
    createTask(),
    new Set(['existing-run']),
    '{"ok":true,"runDir":"/tmp/output/execution-pack-2"}',
    '',
    [createRun()]
  );
  assert.equal(parsedRunId, 'execution-pack-2');

  const fallbackRunId = resolveLatestRunIdForTask(
    createTask({ workflow: 'daily' }),
    new Set(['daily-run-1']),
    '',
    '',
    [
      createRun({
        id: 'daily-run-1',
        kind: 'daily',
        title: 'Daily Job',
        createdAt: '2026-05-13T00:01:00.000Z',
        runDir: '/tmp/output/2026-05-13/daily-run-1',
        relativeRunDir: 'output/2026-05-13/daily-run-1'
      }),
      createRun({
        id: 'daily-run-2',
        kind: 'daily',
        title: 'Daily Job',
        createdAt: '2026-05-13T00:06:00.000Z',
        runDir: '/tmp/output/2026-05-13/daily-run-2',
        relativeRunDir: 'output/2026-05-13/daily-run-2'
      })
    ]
  );
  assert.equal(fallbackRunId, 'daily-run-2');

  const child = new FakeChildProcess();
  const storedTasks = new Map<string, ConsoleTaskRecord>();
  const taskUpdates: ConsoleTaskRecord[] = [];
  let currentRuns: ConsoleRunSummary[] = [];

  const runningTask = runConsoleTask(createTask(), process.env, {
    spawnProcess: () => child as never,
    listRuns: () => currentRuns,
    getTask: (taskId) => storedTasks.get(taskId),
    upsertTask: (task) => {
      storedTasks.set(task.id, task);
      taskUpdates.push(task);
      return task;
    }
  });

  assert.equal(runningTask.status, 'running');
  assert.equal(taskUpdates.at(-1)?.status, 'running');

  child.writeStdout('{"ok":true,"runDir":"/tmp/output/execution-pack-2"}');
  currentRuns = [createRun()];
  child.close(0);
  await flushEvents();

  const succeededTask = storedTasks.get('task-1');
  assert.equal(succeededTask?.status, 'succeeded');
  assert.equal(succeededTask?.latestRunId, 'execution-pack-2');
  assert.equal(succeededTask?.exitCode, 0);

  const failedChild = new FakeChildProcess();
  const failedTasks = new Map<string, ConsoleTaskRecord>();
  runConsoleTask(createTask({ id: 'task-2', workflow: 'story', command: 'story', args: ['--topic', '演示主题'] }), process.env, {
    spawnProcess: () => failedChild as never,
    listRuns: () => [],
    getTask: (taskId) => failedTasks.get(taskId),
    upsertTask: (task) => {
      failedTasks.set(task.id, task);
      return task;
    }
  });

  failedChild.writeStderr('Missing required environment variables: LLM_API_KEY');
  failedChild.close(1);
  await flushEvents();

  const failedTask = failedTasks.get('task-2');
  assert.equal(failedTask?.status, 'failed');
  assert.match(failedTask?.error ?? '', /LLM_API_KEY/);
  assert.equal(failedTask?.latestRunId, undefined);
}

run().then(() => {
  console.log('ops-console workflows tests passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
