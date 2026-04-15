import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { writeDeliveryChecklist } from '../delivery-kit';
import { createRunContext, writeStoryArtifacts } from '../core/run-context';
import type { StoryGenerationOptions, StoryPackage, StoryPackageArtifacts } from '../core/types';
import { StoryEngine } from '../engines/story/story-engine';

export interface GenerateStoryPackageOptions extends StoryGenerationOptions {
  outputRoot?: string;
}

export interface GenerateStoryPackageResult {
  storyPackage: StoryPackage;
  artifacts: StoryPackageArtifacts;
}

function writePublishCopy(runDir: string, storyPackage: StoryPackage): string {
  const publishCopyPath = path.join(runDir, 'publish-copy.txt');
  const lines = [
    storyPackage.title,
    '',
    storyPackage.publish.caption,
    '',
    storyPackage.publish.hashtags.join(' ')
  ];

  writeFileSync(publishCopyPath, lines.join('\n'), 'utf8');
  return publishCopyPath;
}

export async function generateStoryPackage(
  options: GenerateStoryPackageOptions,
): Promise<GenerateStoryPackageResult> {
  const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), 'output', 'runs');
  const runContext = createRunContext(outputRoot, options.topic);
  const engine = new StoryEngine();
  const storyPackage = await engine.generateStory(options);
  const artifacts = writeStoryArtifacts(runContext, storyPackage);
  const publishCopyPath = writePublishCopy(runContext.runDir, storyPackage);

  writeDeliveryChecklist({
    exportDir: runContext.runDir,
    title: storyPackage.title,
    topic: storyPackage.topic,
    niche: storyPackage.niche,
    audioFiles: [],
    imageFiles: []
  });

  return {
    storyPackage,
    artifacts: {
      ...artifacts,
      publishMetaPath: artifacts.publishMetaPath,
      shotListPath: artifacts.shotListPath,
      storyPackagePath: artifacts.storyPackagePath,
      runDir: runContext.runDir,
    }
  };
}

export function formatStoryPackageResult(result: GenerateStoryPackageResult): string {
  return JSON.stringify({
    ok: true,
    storyId: result.storyPackage.id,
    title: result.storyPackage.title,
    runDir: result.artifacts.runDir,
    files: result.artifacts
  }, null, 2);
}
