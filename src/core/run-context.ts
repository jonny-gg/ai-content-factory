import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, writeJsonFile } from '../env-config';
import type { StoryPackage, StoryPackageArtifacts } from './types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'story';
}

export interface RunContext {
  runId: string;
  runDir: string;
  imagesDir: string;
  audioDir: string;
  rendersDir: string;
}

export function createRunContext(outputRoot: string, topic: string): RunContext {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `${stamp}-${slugify(topic)}`;
  const runDir = ensureDir(path.join(outputRoot, runId));

  return {
    runId,
    runDir,
    imagesDir: ensureDir(path.join(runDir, 'images')),
    audioDir: ensureDir(path.join(runDir, 'audio')),
    rendersDir: ensureDir(path.join(runDir, 'renders')),
  };
}

export function writeStoryArtifacts(context: RunContext, storyPackage: StoryPackage): StoryPackageArtifacts {
  const storyPackagePath = path.join(context.runDir, 'story-package.json');
  const publishMetaPath = path.join(context.runDir, 'publish-meta.json');
  const shotListPath = path.join(context.runDir, 'shot-list.md');

  writeJsonFile(storyPackagePath, storyPackage);
  writeJsonFile(publishMetaPath, storyPackage.publish);

  const shotList = [
    `# Shot List - ${storyPackage.title}`,
    '',
    `- Story ID: ${storyPackage.id}`,
    `- Platform: ${storyPackage.platform}`,
    `- Topic: ${storyPackage.topic}`,
    '',
    '## Scenes',
    ...storyPackage.scenes.flatMap((scene) => [
      `### ${scene.order}. ${scene.purpose}`,
      `- Duration: ${scene.durationSec}s`,
      `- Subtitle: ${scene.subtitle}`,
      `- Camera: ${scene.camera ?? 'default'}`,
      `- Transition: ${scene.transition ?? 'cut'}`,
      `- Visual: ${scene.visualPrompt}`,
      scene.narration ? `- Narration: ${scene.narration}` : '- Narration: n/a',
      ...(scene.dialogue?.map((dialogue) => `- Dialogue [${dialogue.characterId}${dialogue.emotion ? `/${dialogue.emotion}` : ''}]: ${dialogue.text}`) ?? []),
      ''
    ])
  ].join('\n');

  fs.writeFileSync(shotListPath, shotList, 'utf8');

  return {
    runDir: context.runDir,
    storyPackagePath,
    publishMetaPath,
    shotListPath,
  };
}
