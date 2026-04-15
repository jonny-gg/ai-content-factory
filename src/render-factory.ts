import { formatRenderVideoResult, renderVideo } from './pipelines/render-video';

export interface RenderCliOptions {
  storyPackagePath?: string;
  assetManifestPath?: string;
  runDir?: string;
  dryRun?: boolean;
}

export async function runRenderVideoCli(options: RenderCliOptions = {}): Promise<void> {
  if (!options.storyPackagePath?.trim()) {
    throw new Error('Missing required --story-package for render pipeline.');
  }

  if (!options.assetManifestPath?.trim()) {
    throw new Error('Missing required --asset-manifest for render pipeline.');
  }

  const result = await renderVideo({
    storyPackagePath: options.storyPackagePath,
    assetManifestPath: options.assetManifestPath,
    runDir: options.runDir,
    dryRun: options.dryRun,
  });

  console.log(formatRenderVideoResult(result));
}
