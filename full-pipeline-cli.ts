#!/usr/bin/env node
import { Command } from 'commander';
import { runFullPipelineCli } from './src/full-pipeline-factory';

async function main() {
  const program = new Command();

  program
    .option('--config <path>', 'Path to runtime config file')
    .option('--template <path>', 'Path to prompt template file')
    .option('--topic <topic>', 'Story topic')
    .option('--style <style>', 'Story style')
    .option('--niche <niche>', 'Story niche')
    .option('--platform <platform>', 'Target platform')
    .option('--language <language>', 'Output language')
    .option('--output-root <path>', 'Output root directory')
    .option('--tts-provider <provider>', 'TTS provider: google-tts | voicerss')
    .option('--audio-voice <voice>', 'Optional TTS voice')
    .option('--skip-images', 'Skip image generation and emit empty image manifest entries only when supported', false)
    .option('--skip-audio', 'Skip audio generation and emit empty audio manifest entries only when supported', false)
    .option('--bgm-path <path>', 'Optional background music file')
    .option('--bgm-volume <number>', 'Background music volume, default 0.18')
    .option('--keep-temp', 'Keep render temp files', false)
    .option('--dry-run', 'Write placeholders instead of calling remote providers / ffmpeg render', false)
    .option('--allow-missing-llm-api-key', 'Allow dry-run or mocked execution without LLM API key', false);

  program.parse(process.argv);
  const options = program.opts();

  await runFullPipelineCli({
    config: options.config,
    template: options.template,
    topic: options.topic,
    style: options.style,
    niche: options.niche,
    platform: options.platform,
    language: options.language,
    outputRoot: options.outputRoot,
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
    bgmPath: options.bgmPath,
    bgmVolume: options.bgmVolume ? Number(options.bgmVolume) : undefined,
    keepTemp: options.keepTemp,
    dryRun: options.dryRun,
    allowMissingLlmApiKey: options.allowMissingLlmApiKey,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
