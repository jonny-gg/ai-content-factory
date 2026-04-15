import { loadOptionalTemplate, loadRuntimeConfig, type RuntimeConfig, type LoadRuntimeConfigOptions } from './load-runtime-config';
import { formatStoryPackageResult, generateStoryPackage } from './pipelines/generate-story-package';
import { generateAssets } from './pipelines/generate-assets';

export interface StoryCliOptions extends LoadRuntimeConfigOptions {
  config?: string;
  template?: string;
  topic?: string;
  style?: string;
  niche?: string;
  platform?: 'douyin' | 'xiaohongshu' | 'tiktok';
  language?: string;
  outputRoot?: string;
  dryRun?: boolean;
  withAssets?: boolean;
  ttsProvider?: 'google-tts' | 'voicerss';
  audioVoice?: string;
  skipImages?: boolean;
  skipAudio?: boolean;
}

export interface ResolvedStoryRun {
  config: RuntimeConfig;
  template: string;
  topic?: string;
  style?: string;
  niche?: string;
  platform?: 'douyin' | 'xiaohongshu' | 'tiktok';
  language?: string;
  outputRoot?: string;
  dryRun: boolean;
  withAssets: boolean;
  ttsProvider?: 'google-tts' | 'voicerss';
  audioVoice?: string;
  skipImages?: boolean;
  skipAudio?: boolean;
}

export function resolveStoryRun(options: StoryCliOptions = {}): ResolvedStoryRun {
  const config = loadRuntimeConfig({
    configPath: options.config ?? options.configPath,
    allowMissingLlmApiKey: options.allowMissingLlmApiKey,
    env: options.env
  });
  const template = loadOptionalTemplate(options.template) || (typeof config.template === 'string' ? config.template : '');

  return {
    config,
    template,
    topic: options.topic,
    style: options.style,
    niche: options.niche,
    platform: options.platform,
    language: options.language,
    outputRoot: options.outputRoot,
    dryRun: typeof options.dryRun === 'boolean' ? options.dryRun : config.dryRun,
    withAssets: Boolean(options.withAssets),
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
  };
}

export async function runStoryGenerationCli(options: StoryCliOptions = {}): Promise<void> {
  const resolved = resolveStoryRun(options);

  if (resolved.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: resolved.withAssets ? 'story+assets' : 'story',
      config: resolved.config,
      hasTemplate: resolved.template.length > 0,
      topic: resolved.topic ?? null,
      style: resolved.style ?? null,
      niche: resolved.niche ?? null,
      platform: resolved.platform ?? null,
      language: resolved.language ?? null,
      outputRoot: resolved.outputRoot ?? null,
      withAssets: resolved.withAssets,
      ttsProvider: resolved.ttsProvider ?? null,
      audioVoice: resolved.audioVoice ?? null,
      skipImages: resolved.skipImages ?? false,
      skipAudio: resolved.skipAudio ?? false,
    }, null, 2));
    return;
  }

  if (!resolved.topic?.trim()) {
    throw new Error('Missing required --topic for story generation.');
  }

  const result = await generateStoryPackage({
    topic: resolved.topic,
    niche: resolved.niche,
    platform: resolved.platform,
    style: resolved.style,
    language: resolved.language,
    template: resolved.template,
    outputRoot: resolved.outputRoot,
  });

  if (!resolved.withAssets) {
    console.log(formatStoryPackageResult(result));
    return;
  }

  const assetsResult = await generateAssets({
    storyPackagePath: result.artifacts.storyPackagePath,
    runDir: result.artifacts.runDir,
    ttsProvider: resolved.ttsProvider,
    audioVoice: resolved.audioVoice,
    skipImages: resolved.skipImages,
    skipAudio: resolved.skipAudio,
    dryRun: false,
  });

  console.log(JSON.stringify({
    ok: true,
    mode: 'story+assets',
    storyId: result.storyPackage.id,
    title: result.storyPackage.title,
    runDir: result.artifacts.runDir,
    storyFiles: result.artifacts,
    assetManifestPath: assetsResult.assetManifestPath,
    images: assetsResult.assetManifest.images.length,
    audio: assetsResult.assetManifest.audio.length,
  }, null, 2));
}
