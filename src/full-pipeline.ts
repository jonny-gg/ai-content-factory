import path from 'node:path';
import { resolveStoryRun, type StoryCliOptions } from './story-factory';
import { generateStoryPackage } from './pipelines/generate-story-package';
import { generateAssets } from './pipelines/generate-assets';
import { renderVideo } from './pipelines/render-video';

export interface FullPipelineOptions extends StoryCliOptions {
  bgmPath?: string;
  bgmVolume?: number;
  keepTemp?: boolean;
}

export interface FullPipelineResult {
  runDir: string;
  storyPackagePath: string;
  assetManifestPath: string;
  renderManifestPath: string;
  finalVideoPath: string;
}

export async function runFullPipeline(options: FullPipelineOptions = {}): Promise<FullPipelineResult> {
  const resolved = resolveStoryRun({
    ...options,
    withAssets: true,
  });

  if (!resolved.topic?.trim()) {
    throw new Error('Missing required --topic for full pipeline.');
  }

  const storyResult = await generateStoryPackage({
    topic: resolved.topic,
    style: resolved.style,
    niche: resolved.niche,
    platform: resolved.platform,
    language: resolved.language,
    template: resolved.template,
    outputRoot: resolved.outputRoot,
  });

  const assetResult = await generateAssets({
    storyPackagePath: storyResult.artifacts.storyPackagePath,
    runDir: storyResult.artifacts.runDir,
    ttsProvider: resolved.ttsProvider,
    audioVoice: resolved.audioVoice,
    skipImages: resolved.skipImages,
    skipAudio: resolved.skipAudio,
    dryRun: resolved.dryRun,
  });

  const renderResult = await renderVideo({
    storyPackagePath: storyResult.artifacts.storyPackagePath,
    assetManifestPath: assetResult.assetManifestPath,
    runDir: storyResult.artifacts.runDir,
    dryRun: resolved.dryRun,
    bgmPath: options.bgmPath,
    bgmVolume: options.bgmVolume,
    keepTemp: options.keepTemp,
  });

  return {
    runDir: storyResult.artifacts.runDir,
    storyPackagePath: storyResult.artifacts.storyPackagePath,
    assetManifestPath: assetResult.assetManifestPath,
    renderManifestPath: renderResult.renderManifestPath,
    finalVideoPath: path.join(storyResult.artifacts.runDir, 'renders', 'final.mp4'),
  };
}

export function formatFullPipelineResult(result: FullPipelineResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'full-pipeline',
    runDir: result.runDir,
    storyPackagePath: result.storyPackagePath,
    assetManifestPath: result.assetManifestPath,
    renderManifestPath: result.renderManifestPath,
    finalVideoPath: result.finalVideoPath,
  }, null, 2);
}
