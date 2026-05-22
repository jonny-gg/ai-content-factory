import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
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

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createSolidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let offset = 1; offset < row.length; offset += 3) {
    row[offset] = rgb[0];
    row[offset + 1] = rgb[1];
    row[offset + 2] = rgb[2];
  }

  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    signature,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', deflateSync(raw)),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createSilentWav(durationSec: number, sampleRate = 16000): Buffer {
  const safeDuration = Math.max(0.1, durationSec);
  const samples = Math.ceil(safeDuration * sampleRate);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function createFallbackImage(outputPath: string, scene: StoryPackage['scenes'][number]): void {
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, createSolidPng(1080, 1920, [18, 24, 38]));
}

function createFallbackAudio(outputPath: string, scene: StoryPackage['scenes'][number]): string {
  const wavPath = outputPath.replace(/\.[^.]+$/, '.wav');
  ensureDir(path.dirname(wavPath));
  fs.writeFileSync(wavPath, createSilentWav(scene.durationSec));
  return wavPath;
}

async function generateImages(
  storyPackage: StoryPackage,
  imagesDir: string,
  options: GenerateAssetsOptions,
): Promise<AssetImageItem[]> {
  if (options.skipImages) return [];

  let imageService: ImageService | null = null;
  if (!options.dryRun) {
    try {
      imageService = new ImageService();
    } catch (error) {
      console.warn('Image service unavailable, using local fallback images:', error);
    }
  }
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
      const fallbackPath = createFallbackAudio(outputPath, scene);
      audio.push({
        sceneId: scene.sceneId,
        path: fallbackPath,
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
      audio.push({
        sceneId: scene.sceneId,
        path: createFallbackAudio(outputPath, scene),
        voice: options.audioVoice ?? 'zh-CN',
        durationSec: scene.durationSec,
      });
      continue;
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
