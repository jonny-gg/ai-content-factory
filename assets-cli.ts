import { Command } from 'commander';
import { runAssetsGenerationCli } from './src/assets-factory';

async function main() {
  const program = new Command();

  program
    .option('--story-package <path>', 'Path to story-package.json')
    .option('--run-dir <path>', 'Override output run directory')
    .option('--tts-provider <provider>', 'TTS provider', 'google-tts')
    .option('--audio-voice <voice>', 'TTS voice', 'zh-CN')
    .option('--skip-images', 'Skip image generation', false)
    .option('--skip-audio', 'Skip audio generation', false)
    .option('--dry-run', 'Write placeholders instead of real remote generation', false);

  program.parse(process.argv);
  const options = program.opts();

  await runAssetsGenerationCli({
    storyPackagePath: options.storyPackage,
    runDir: options.runDir,
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
    dryRun: options.dryRun,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
