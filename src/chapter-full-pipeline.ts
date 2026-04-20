import { buildChapterStory, type BuildChapterStoryOptions } from './chapter-adapter';
import { generateAssets } from './pipelines/generate-assets';
import { renderVideo } from './pipelines/render-video';
import { exportDeliveryPackage } from './delivery-kit';

export interface ChapterFullPipelineOptions extends BuildChapterStoryOptions {
  ttsProvider?: 'google-tts' | 'voicerss';
  audioVoice?: string;
  skipImages?: boolean;
  skipAudio?: boolean;
  dryRun?: boolean;
  bgmPath?: string;
  bgmVolume?: number;
  keepTemp?: boolean;
}

export interface ChapterFullPipelineResult {
  runDir: string;
  storyPackagePath: string;
  assetManifestPath: string;
  renderManifestPath: string;
  finalVideoPath: string;
  deliveryManifestPath: string;
  deliveryDocPath: string;
}

export async function runChapterFullPipeline(options: ChapterFullPipelineOptions): Promise<ChapterFullPipelineResult> {
  const chapterResult = await buildChapterStory(options);

  const assetsResult = await generateAssets({
    storyPackagePath: chapterResult.storyPackagePath,
    runDir: chapterResult.runDir,
    ttsProvider: options.ttsProvider,
    audioVoice: options.audioVoice,
    skipImages: options.skipImages,
    skipAudio: options.skipAudio,
    dryRun: options.dryRun,
  });

  const renderResult = await renderVideo({
    storyPackagePath: chapterResult.storyPackagePath,
    assetManifestPath: assetsResult.assetManifestPath,
    runDir: chapterResult.runDir,
    dryRun: options.dryRun,
    bgmPath: options.bgmPath,
    bgmVolume: options.bgmVolume,
    keepTemp: options.keepTemp,
  });

  const deliveryResult = await exportDeliveryPackage({
    storyPackagePath: chapterResult.storyPackagePath,
    assetManifestPath: assetsResult.assetManifestPath,
    renderManifestPath: renderResult.renderManifestPath,
    runDir: chapterResult.runDir,
  });

  return {
    runDir: chapterResult.runDir,
    storyPackagePath: chapterResult.storyPackagePath,
    assetManifestPath: assetsResult.assetManifestPath,
    renderManifestPath: renderResult.renderManifestPath,
    finalVideoPath: renderResult.renderManifest.finalVideoPath,
    deliveryManifestPath: deliveryResult.deliveryManifestPath,
    deliveryDocPath: deliveryResult.deliveryDocPath,
  };
}

export function formatChapterFullPipelineResult(result: ChapterFullPipelineResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'chapter-full-pipeline',
    runDir: result.runDir,
    storyPackagePath: result.storyPackagePath,
    assetManifestPath: result.assetManifestPath,
    renderManifestPath: result.renderManifestPath,
    finalVideoPath: result.finalVideoPath,
    deliveryManifestPath: result.deliveryManifestPath,
    deliveryDocPath: result.deliveryDocPath,
  }, null, 2);
}
