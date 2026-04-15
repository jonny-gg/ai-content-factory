import { formatGenerateAssetsResult, generateAssets } from './pipelines/generate-assets';

export interface AssetsCliOptions {
  storyPackagePath?: string;
  runDir?: string;
  ttsProvider?: 'google-tts' | 'voicerss';
  audioVoice?: string;
  skipImages?: boolean;
  skipAudio?: boolean;
  dryRun?: boolean;
}

export async function runAssetsGenerationCli(options: AssetsCliOptions = {}): Promise<void> {
  if (!options.storyPackagePath?.trim()) {
    throw new Error('Missing required --story-package for assets generation.');
  }

  const result = await generateAssets({
    storyPackagePath: options.storyPackagePath,
    runDir: options.runDir,
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
    dryRun: options.dryRun,
  });

  console.log(formatGenerateAssetsResult(result));
}
