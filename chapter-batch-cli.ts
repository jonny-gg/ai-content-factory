#!/usr/bin/env node
import { Command } from 'commander';
import { formatChapterBatchResult, runChapterBatch } from './src/chapter-batch';

function parseChapterNumbers(input?: string): number[] | undefined {
  if (!input?.trim()) return undefined;
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

async function main() {
  const program = new Command();

  program
    .requiredOption('--index <path>', 'Path to production-pack-index.json')
    .option('--chapters <list>', 'Comma-separated chapter numbers, e.g. 1,2,3')
    .option('--stage <stageId>', 'Run all chapters in a stage, e.g. stage-01')
    .option('--output-root <path>', 'Output root directory for generated chapter artifacts')
    .option('--niche <niche>', 'Override niche label')
    .option('--genre <genre>', 'Override genre label')
    .option('--platform <platform>', 'Override target platform')
    .option('--tts-provider <provider>', 'TTS provider: google-tts | voicerss')
    .option('--audio-voice <voice>', 'Optional TTS voice')
    .option('--skip-images', 'Skip image generation', false)
    .option('--skip-audio', 'Skip audio generation', false)
    .option('--bgm-path <path>', 'Optional background music file')
    .option('--bgm-volume <number>', 'Background music volume, default 0.18')
    .option('--keep-temp', 'Keep render temp files', false)
    .option('--dry-run', 'Write placeholders instead of calling remote providers / ffmpeg render', false);

  program.parse(process.argv);
  const options = program.opts();

  const result = await runChapterBatch({
    indexPath: options.index,
    chapterNumbers: parseChapterNumbers(options.chapters),
    stage: options.stage,
    outputRoot: options.outputRoot,
    niche: options.niche,
    genre: options.genre,
    platform: options.platform,
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
    bgmPath: options.bgmPath,
    bgmVolume: options.bgmVolume ? Number(options.bgmVolume) : undefined,
    keepTemp: options.keepTemp,
    dryRun: options.dryRun,
  });

  console.log(formatChapterBatchResult(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
