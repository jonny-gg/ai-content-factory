import fs from 'node:fs';
import path from 'node:path';
import { writeDeliveryChecklist } from '../delivery-kit';
import { ensureDir, writeJsonFile } from '../env-config';
import type { AssetManifest, AssetAudioItem, AssetImageItem, StoryPackage } from '../core/types';
import { ImageService } from '../image-service';
import { TTSService } from '../tts-service';

export interface GenerateAssetsOptions {
  storyPackagePath: string;
  runDir?: string;
  ttsProvider?: 'google-tts' | 'voicerss';
  audioVoice?: string;
  skipImages?: boolean;
  skipAudio?: boolean;
  dryRun?: boolean;
}

export interface GenerateAssetsResult {
  storyPackage: StoryPackage;
  assetManifest: AssetManifest;
  assetManifestPath: string;
  runDir: string;
  imagesDir: string;
  audioDir: string;
}

function resolveRunDir(storyPackagePath: string, runDir?: string): string {
  if (runDir?.trim()) {
    return path.resolve(runDir);
  }

  return path.dirname(path.resolve(storyPackagePath));
}

function buildSceneText(storyPackage: StoryPackage, scene: StoryPackage['scenes'][number]): string {
  const dialogueText = (scene.dialogue ?? [])
    .map((dialogue) => {
      const character = storyPackage.characters.find((item) => item.id === dialogue.characterId);
      const speaker = character?.name ?? dialogue.characterId;
      return `${speaker}：${dialogue.text}`;
    })
    .join(' ');

  return [
    scene.subtitleText,
    scene.subtitle,
    scene.narration,
    dialogueText
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();
}

function createFallbackImage(outputPath: string, scene: StoryPackage['scenes'][number]): void {
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, JSON.stringify({
    placeholder: true,
    reason: 'image-generation-failed',
    sceneId: scene.sceneId,
    visualPrompt: scene.visualPrompt
  }, null, 2), 'utf8');
}

async function generateImages(
  storyPackage: StoryPackage,
  imagesDir: string,
  options: GenerateAssetsOptions,
): Promise<AssetImageItem[]> {
  if (options.skipImages) return [];

  const imageService = options.dryRun ? null : new ImageService();
  const images: AssetImageItem[] = [];

  for (const scene of storyPackage.scenes) {
    const outputPath = path.join(imagesDir, `${String(scene.order).padStart(2, '0')}-${scene.sceneId}.png`);

    if (options.dryRun) {
      createFallbackImage(outputPath, scene);
      images.push({
        sceneId: scene.sceneId,
        path: outputPath,
        prompt: scene.visualPrompt,
      });
      continue;
    }

    try {
      if (!imageService) {
        throw new Error('Image service unavailable in dry-run mode');
      }
      await imageService.generateAndSave(scene.visualPrompt, outputPath);
    } catch (error) {
      console.warn(`Image generation failed for scene ${scene.sceneId}:`, error);
      createFallbackImage(outputPath, scene);
    }

    images.push({
      sceneId: scene.sceneId,
      path: outputPath,
      prompt: scene.visualPrompt,
    });
  }

  return images;
}

async function generateAudio(
  storyPackage: StoryPackage,
  audioDir: string,
  options: GenerateAssetsOptions,
): Promise<AssetAudioItem[]> {
  if (options.skipAudio) return [];

  const ttsService = new TTSService();
  const audio: AssetAudioItem[] = [];

  for (const scene of storyPackage.scenes) {
    const text = buildSceneText(storyPackage, scene);
    const outputPath = path.join(audioDir, `${String(scene.order).padStart(2, '0')}-${scene.sceneId}.mp3`);

    if (options.dryRun) {
      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, text || `scene ${scene.sceneId}`, 'utf8');
      audio.push({
        sceneId: scene.sceneId,
        path: outputPath,
        voice: options.audioVoice ?? 'zh-CN',
        durationSec: scene.durationSec,
      });
      continue;
    }

    try {
      await ttsService.generateSpeech(text || scene.visualPrompt, {
        provider: options.ttsProvider ?? 'google-tts',
        voice: options.audioVoice ?? 'zh-CN',
        outputPath,
      });
    } catch (error) {
      console.warn(`Audio generation failed for scene ${scene.sceneId}:`, error);
      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, text || `scene ${scene.sceneId}`, 'utf8');
    }

    audio.push({
      sceneId: scene.sceneId,
      path: outputPath,
      voice: options.audioVoice ?? 'zh-CN',
      durationSec: scene.durationSec,
    });
  }

  return audio;
}

export async function generateAssets(options: GenerateAssetsOptions): Promise<GenerateAssetsResult> {
  const storyPackagePath = path.resolve(options.storyPackagePath);
  const storyPackage = JSON.parse(fs.readFileSync(storyPackagePath, 'utf8')) as StoryPackage;
  const runDir = resolveRunDir(storyPackagePath, options.runDir);
  const imagesDir = ensureDir(path.join(runDir, 'images'));
  const audioDir = ensureDir(path.join(runDir, 'audio'));

  const [images, audio] = await Promise.all([
    generateImages(storyPackage, imagesDir, options),
    generateAudio(storyPackage, audioDir, options),
  ]);

  const assetManifest: AssetManifest = {
    storyPackageId: storyPackage.id,
    generatedAt: new Date().toISOString(),
    images,
    audio,
  };

  const assetManifestPath = path.join(runDir, 'asset-manifest.json');
  writeJsonFile(assetManifestPath, assetManifest);

  writeDeliveryChecklist({
    exportDir: runDir,
    title: storyPackage.title,
    topic: storyPackage.topic,
    niche: storyPackage.niche,
    audioFiles: audio.map((item) => item.path),
    imageFiles: images.map((item) => item.path),
  });

  return {
    storyPackage,
    assetManifest,
    assetManifestPath,
    runDir,
    imagesDir,
    audioDir,
  };
}

export function formatGenerateAssetsResult(result: GenerateAssetsResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'assets',
    storyId: result.storyPackage.id,
    runDir: result.runDir,
    images: result.assetManifest.images.length,
    audio: result.assetManifest.audio.length,
    assetManifestPath: result.assetManifestPath,
  }, null, 2);
}
