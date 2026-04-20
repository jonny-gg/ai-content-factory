import * as fs from 'fs';
import * as path from 'path';
import type { AssetManifest, RenderManifest, StoryPackage } from './core/types';

export interface DeliveryChecklistInput {
  exportDir: string;
  title?: string;
  topic?: string;
  niche?: string;
  audioFiles?: string[];
  imageFiles?: string[];
}

export interface DeliveryExportOptions {
  storyPackagePath: string;
  assetManifestPath?: string;
  renderManifestPath?: string;
  runDir?: string;
}

export interface DeliveryManifest {
  storyId: string;
  generatedAt: string;
  runDir: string;
  title: string;
  topic: string;
  niche: string;
  platform: string;
  hook: string;
  summary: string;
  publish: {
    title: string;
    hook: string;
    caption: string;
    description: string;
    hashtags: string[];
    tags: string[];
    coverText?: string;
  };
  files: {
    storyPackagePath: string;
    assetManifestPath?: string;
    renderManifestPath?: string;
    publishCopyPath?: string;
    shotListPath?: string;
    subtitlesPath?: string;
    finalVideoPath?: string;
    coverImagePath?: string;
    audioFiles: string[];
    imageFiles: string[];
  };
  sceneCount: number;
  totalAudioItems: number;
  totalImageItems: number;
}

export interface DeliveryExportResult {
  runDir: string;
  deliveryManifest: DeliveryManifest;
  deliveryManifestPath: string;
  deliveryDocPath: string;
  deliveryChecklistPath: string;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function maybeReadJsonFile<T>(filePath?: string): T | undefined {
  if (!filePath) return undefined;
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return undefined;
  return JSON.parse(fs.readFileSync(resolved, 'utf8')) as T;
}

function toRelative(runDir: string, targetPath?: string): string | undefined {
  if (!targetPath) return undefined;
  const resolved = path.resolve(targetPath);
  return path.relative(runDir, resolved) || path.basename(resolved);
}

function uniqueNonEmpty(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

function buildTags(storyPackage: StoryPackage): string[] {
  return uniqueNonEmpty([
    storyPackage.niche,
    storyPackage.topic,
    storyPackage.genre,
    storyPackage.platform,
    ...storyPackage.publish.hashtags.map((tag) => tag.replace(/^#/, '').trim()),
  ]);
}

function buildDescription(storyPackage: StoryPackage): string {
  return [
    storyPackage.summary,
    `核心钩子：${storyPackage.hook}`,
    `结尾引导：${storyPackage.cta}`,
  ].join('\n');
}

function buildDeliveryDoc(manifest: DeliveryManifest): string {
  const lines = [
    '# DELIVERY PACKAGE',
    '',
    `- Title: ${manifest.title}`,
    `- Topic: ${manifest.topic}`,
    `- Niche: ${manifest.niche}`,
    `- Platform: ${manifest.platform}`,
    `- Story ID: ${manifest.storyId}`,
    `- Scene Count: ${manifest.sceneCount}`,
    '',
    '## Publish Copy',
    `- Title: ${manifest.publish.title}`,
    `- Hook: ${manifest.publish.hook}`,
    `- Caption: ${manifest.publish.caption}`,
    `- Description: ${manifest.publish.description}`,
    `- Hashtags: ${manifest.publish.hashtags.join(' ')}`,
    `- Tags: ${manifest.publish.tags.join(', ')}`,
    manifest.publish.coverText ? `- Cover Text: ${manifest.publish.coverText}` : undefined,
    '',
    '## Deliverables',
    `- Story Package: ${manifest.files.storyPackagePath}`,
    manifest.files.assetManifestPath ? `- Asset Manifest: ${manifest.files.assetManifestPath}` : undefined,
    manifest.files.renderManifestPath ? `- Render Manifest: ${manifest.files.renderManifestPath}` : undefined,
    manifest.files.publishCopyPath ? `- Publish Copy: ${manifest.files.publishCopyPath}` : undefined,
    manifest.files.shotListPath ? `- Shot List: ${manifest.files.shotListPath}` : undefined,
    manifest.files.subtitlesPath ? `- Subtitles: ${manifest.files.subtitlesPath}` : undefined,
    manifest.files.finalVideoPath ? `- Final Video: ${manifest.files.finalVideoPath}` : undefined,
    manifest.files.coverImagePath ? `- Cover Image: ${manifest.files.coverImagePath}` : undefined,
    ...manifest.files.audioFiles.map((file) => `- Audio: ${file}`),
    ...manifest.files.imageFiles.map((file) => `- Image: ${file}`),
    '',
    '## Suggested Manual Delivery Steps',
    '1. Review DELIVERY.md and delivery-manifest.json.',
    '2. Preview final video and subtitles before publishing.',
    '3. Use the publish copy for Douyin/Xiaohongshu/TikTok posting.',
    '4. Hand off the full run directory to client or ops teammate.',
  ].filter((line): line is string => typeof line === 'string');

  return lines.join('\n');
}

export function writeDeliveryChecklist(input: DeliveryChecklistInput): string {
  const audioFiles = input.audioFiles ?? [];
  const imageFiles = input.imageFiles ?? [];

  const lines = [
    '# Delivery Checklist',
    '',
    `Title: ${input.title ?? 'Untitled'}`,
    `Topic: ${input.topic ?? 'N/A'}`,
    `Niche: ${input.niche ?? 'N/A'}`,
    '',
    '## Files',
    '- story-package.json',
    '- publish-copy.txt',
    '- platform-copies.json',
    '- shot-list.md',
    ...audioFiles.map(file => `- ${path.basename(file)}`),
    ...imageFiles.map(file => `- ${path.basename(file)}`),
    '',
    '## Manual publishing steps',
    '1. Open CapCut / 剪映',
    '2. Import voice files in scene order',
    '3. Add stock footage or generated images per shot-list.md',
    '4. Overlay subtitles from each scene.subtitle',
    '5. Export vertical 9:16 video',
    '6. Copy platform text from platform-copies.json or publish-copy.txt'
  ];

  ensureDir(input.exportDir);
  const checklistPath = path.join(input.exportDir, 'delivery-checklist.md');
  fs.writeFileSync(checklistPath, lines.join('\n'), 'utf-8');
  return checklistPath;
}

export async function exportDeliveryPackage(options: DeliveryExportOptions): Promise<DeliveryExportResult> {
  const storyPackagePath = path.resolve(options.storyPackagePath);
  const storyPackage = maybeReadJsonFile<StoryPackage>(storyPackagePath);

  if (!storyPackage) {
    throw new Error(`Story package not found: ${storyPackagePath}`);
  }

  const runDir = path.resolve(options.runDir ?? path.dirname(storyPackagePath));
  const assetManifest = maybeReadJsonFile<AssetManifest>(options.assetManifestPath ?? path.join(runDir, 'asset-manifest.json'));
  const renderManifest = maybeReadJsonFile<RenderManifest>(options.renderManifestPath ?? path.join(runDir, 'render-manifest.json'));

  const audioFiles = (assetManifest?.audio ?? []).map((item) => toRelative(runDir, item.path)).filter((value): value is string => Boolean(value));
  const imageFiles = (assetManifest?.images ?? []).map((item) => toRelative(runDir, item.path)).filter((value): value is string => Boolean(value));
  const publishCopyPath = fs.existsSync(path.join(runDir, 'publish-copy.txt')) ? 'publish-copy.txt' : undefined;
  const shotListPath = fs.existsSync(path.join(runDir, 'shot-list.md')) ? 'shot-list.md' : undefined;
  const checklistPath = writeDeliveryChecklist({
    exportDir: runDir,
    title: storyPackage.title,
    topic: storyPackage.topic,
    niche: storyPackage.niche,
    audioFiles,
    imageFiles,
  });

  const deliveryManifest: DeliveryManifest = {
    storyId: storyPackage.id,
    generatedAt: new Date().toISOString(),
    runDir,
    title: storyPackage.title,
    topic: storyPackage.topic,
    niche: storyPackage.niche,
    platform: storyPackage.platform,
    hook: storyPackage.hook,
    summary: storyPackage.summary,
    publish: {
      title: storyPackage.publish.title ?? storyPackage.title,
      hook: storyPackage.hook,
      caption: storyPackage.publish.caption,
      description: buildDescription(storyPackage),
      hashtags: storyPackage.publish.hashtags,
      tags: buildTags(storyPackage),
      coverText: storyPackage.publish.coverText,
    },
    files: {
      storyPackagePath: toRelative(runDir, storyPackagePath) ?? 'story-package.json',
      assetManifestPath: assetManifest ? toRelative(runDir, options.assetManifestPath ?? path.join(runDir, 'asset-manifest.json')) : undefined,
      renderManifestPath: renderManifest ? toRelative(runDir, options.renderManifestPath ?? path.join(runDir, 'render-manifest.json')) : undefined,
      publishCopyPath,
      shotListPath,
      subtitlesPath: renderManifest?.subtitlesPath ? toRelative(runDir, renderManifest.subtitlesPath) : assetManifest?.subtitles?.path ? toRelative(runDir, assetManifest.subtitles.path) : undefined,
      finalVideoPath: renderManifest?.finalVideoPath ? toRelative(runDir, renderManifest.finalVideoPath) : undefined,
      coverImagePath: renderManifest?.coverImagePath ? toRelative(runDir, renderManifest.coverImagePath) : undefined,
      audioFiles,
      imageFiles,
    },
    sceneCount: storyPackage.scenes.length,
    totalAudioItems: audioFiles.length,
    totalImageItems: imageFiles.length,
  };

  const deliveryManifestPath = path.join(runDir, 'delivery-manifest.json');
  const deliveryDocPath = path.join(runDir, 'DELIVERY.md');
  fs.writeFileSync(deliveryManifestPath, JSON.stringify(deliveryManifest, null, 2), 'utf8');
  fs.writeFileSync(deliveryDocPath, buildDeliveryDoc(deliveryManifest), 'utf8');

  return {
    runDir,
    deliveryManifest,
    deliveryManifestPath,
    deliveryDocPath,
    deliveryChecklistPath: checklistPath,
  };
}

export function formatDeliveryExportResult(result: DeliveryExportResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'delivery-export',
    runDir: result.runDir,
    deliveryManifestPath: result.deliveryManifestPath,
    deliveryDocPath: result.deliveryDocPath,
    deliveryChecklistPath: result.deliveryChecklistPath,
    title: result.deliveryManifest.title,
    sceneCount: result.deliveryManifest.sceneCount,
    finalVideoPath: result.deliveryManifest.files.finalVideoPath ?? null,
  }, null, 2);
}
