#!/usr/bin/env node
const { spawnSync } = require('child_process');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['ts-node', 'src/daily-job.ts'],
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
