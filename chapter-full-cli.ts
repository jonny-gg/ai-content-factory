#!/usr/bin/env node
import { Command } from 'commander';
import { runChapterFullPipelineCli } from './src/chapter-full-pipeline-factory';

async function main() {
  const program = new Command();

  program
    .requiredOption('--chapter-pack <path>', 'Path to chapter-xx-production-pack.json')
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

  await runChapterFullPipelineCli({
    chapterPackPath: options.chapterPack,
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
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
