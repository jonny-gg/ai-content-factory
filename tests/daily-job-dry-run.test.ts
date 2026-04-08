import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { runDailyJob } from '../src/daily-job';

async function run(): Promise<void> {
  const outputDir = join(tmpdir(), `ai-content-factory-dry-run-${Date.now()}`);

  try {
    const result = await runDailyJob({
      OPENAI_API_KEY: 'test-key',
      OUTPUT_DIR: outputDir,
      DRY_RUN: 'true',
      REQUEST_TIMEOUT_MS: '1000',
      MAX_RETRIES: '1',
      RETRY_BASE_DELAY_MS: '1',
      LLM_MODEL: 'test-model'
    } as NodeJS.ProcessEnv);

    assert.equal(result.dryRun, true);
    assert.equal(result.estimatedCostUsd, 0);
    assert.equal(existsSync(join(result.runDir, 'run-meta.json')), true);

    const meta = JSON.parse(readFileSync(join(result.runDir, 'run-meta.json'), 'utf8')) as {
      dryRun: boolean;
      steps: Array<{ status: string }>;
    };

    assert.equal(meta.dryRun, true);
    assert.equal(meta.steps.length >= 3, true);
    assert.equal(meta.steps.every((step) => step.status === 'skipped'), true);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

run().then(() => {
  console.log('daily-job dry-run tests passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
