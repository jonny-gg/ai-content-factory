#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
if (forwardedArgs.includes('--help') || forwardedArgs.includes('-h')) {
  console.log(`Usage: npm run daily\n\nRuns the daily orchestration flow defined in src/daily-job.ts.\n\nEnvironment:\n  DRY_RUN=true      Skip external commands and notifications\n  OUTPUT_DIR=<dir>  Override output root\n`);
  process.exit(0);
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsx', 'src/daily-job.ts', ...forwardedArgs],
  {
    stdio: 'inherit',
    env: process.env
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
