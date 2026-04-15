#!/usr/bin/env node
import { runShortDramaCli } from './src/short-drama-factory';

function getFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  await runShortDramaCli({
    topic: getFlagValue(args, '--topic'),
    style: getFlagValue(args, '--style'),
    niche: getFlagValue(args, '--niche'),
    platform: getFlagValue(args, '--platform') as 'douyin' | 'xiaohongshu' | 'tiktok' | undefined,
    language: getFlagValue(args, '--language'),
    outputRoot: getFlagValue(args, '--output-root'),
    template: getFlagValue(args, '--template'),
    config: getFlagValue(args, '--config'),
    dryRun: args.includes('--dry-run')
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
