#!/usr/bin/env node
import { Command } from 'commander';
import { buildChapterStory, formatBuildChapterStoryResult } from './src/chapter-adapter';

async function main() {
  const program = new Command();

  program
    .requiredOption('--chapter-pack <path>', 'Path to chapter-xx-production-pack.json')
    .option('--output-root <path>', 'Output root directory for generated chapter story package')
    .option('--niche <niche>', 'Override niche label')
    .option('--genre <genre>', 'Override genre label')
    .option('--platform <platform>', 'Override target platform');

  program.parse(process.argv);
  const options = program.opts();

  const result = await buildChapterStory({
    chapterPackPath: options.chapterPack,
    outputRoot: options.outputRoot,
    niche: options.niche,
    genre: options.genre,
    platform: options.platform,
  });

  console.log(formatBuildChapterStoryResult(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
