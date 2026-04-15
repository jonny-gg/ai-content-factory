import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureDir, writeJsonFile } from '../env-config';
import type { AssetManifest, RenderManifest, RenderPackage, RenderTrack, StoryPackage } from '../core/types';

export interface RenderVideoOptions {
  storyPackagePath: string;
  assetManifestPath: string;
  runDir?: string;
  dryRun?: boolean;
  bgmPath?: string;
  bgmVolume?: number;
  keepTemp?: boolean;
}

export interface RenderVideoResult {
  storyPackage: StoryPackage;
  assetManifest: AssetManifest;
  renderPackage: RenderPackage;
  renderManifest: RenderManifest;
  renderPackagePath: string;
  renderManifestPath: string;
  srtPath: string;
  runDir: string;
}

function resolveRunDir(storyPackagePath: string, runDir?: string): string {
  if (runDir?.trim()) {
    return path.resolve(runDir);
  }

  return path.dirname(path.resolve(storyPackagePath));
}

function toSrtTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const wholeMs = Math.round(safe * 1000);
  const hours = Math.floor(wholeMs / 3600000);
  const minutes = Math.floor((wholeMs % 3600000) / 60000);
  const secs = Math.floor((wholeMs % 60000) / 1000);
  const milliseconds = wholeMs % 1000;

  return [hours, minutes, secs]
    .map((part) => String(part).padStart(2, '0'))
    .join(':') + `,${String(milliseconds).padStart(3, '0')}`;
}

function buildSubtitleText(scene: StoryPackage['scenes'][number]): string {
  return [scene.subtitleText, scene.subtitle, scene.narration]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
    .trim() || scene.visualPrompt;
}

function resolveAssetPath(runDir: string, assetPath: string | undefined): string {
  if (!assetPath?.trim()) {
    return '';
  }

  const trimmed = assetPath.trim();
  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  return path.resolve(runDir, trimmed);
}

function buildRenderTracks(storyPackage: StoryPackage, assetManifest: AssetManifest, runDir: string): RenderTrack[] {
  let currentTime = 0;

  return storyPackage.scenes.map((scene) => {
    const image = assetManifest.images.find((item) => item.sceneId === scene.sceneId);
    const audio = assetManifest.audio.find((item) => item.sceneId === scene.sceneId);
    const durationSec = audio?.durationSec ?? scene.durationSec ?? 5;
    const track: RenderTrack = {
      sceneId: scene.sceneId,
      imagePath: resolveAssetPath(runDir, image?.path ?? scene.imageAsset),
      audioPath: resolveAssetPath(runDir, audio?.path ?? scene.audioAsset),
      subtitleText: buildSubtitleText(scene),
      startSec: currentTime,
      endSec: currentTime + durationSec,
    };

    currentTime += durationSec;
    return track;
  });
}

function buildSrt(renderTracks: RenderTrack[]): string {
  return renderTracks
    .map((track, index) => [
      String(index + 1),
      `${toSrtTime(track.startSec)} --> ${toSrtTime(track.endSec)}`,
      track.subtitleText,
      '',
    ].join('\n'))
    .join('\n');
}

function ensureRenderableTracks(renderTracks: RenderTrack[]): void {
  if (renderTracks.length === 0) {
    throw new Error('Render pipeline requires at least one scene track.');
  }

  for (const track of renderTracks) {
    if (!track.imagePath) {
      throw new Error(`Missing image path for scene ${track.sceneId}.`);
    }

    if (!fs.existsSync(track.imagePath)) {
      throw new Error(`Image file not found for scene ${track.sceneId}: ${track.imagePath}`);
    }

    if (!track.audioPath) {
      throw new Error(`Missing audio path for scene ${track.sceneId}.`);
    }

    if (!fs.existsSync(track.audioPath)) {
      throw new Error(`Audio file not found for scene ${track.sceneId}: ${track.audioPath}`);
    }
  }
}

function execFfmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-y', ...args], {
    stdio: 'inherit',
  });
}

function renderSceneClips(renderTracks: RenderTrack[], tempDir: string): string[] {
  return renderTracks.map((track, index) => {
    const clipPath = path.join(tempDir, `${String(index + 1).padStart(3, '0')}-${track.sceneId}.mp4`);
    const duration = Math.max(0.1, track.endSec - track.startSec);

    execFfmpeg([
      '-loop', '1',
      '-i', track.imagePath,
      '-i', track.audioPath,
      '-c:v', 'libx264',
      '-t', duration.toFixed(3),
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      clipPath,
    ]);

    return clipPath;
  });
}

function concatClips(sceneClipPaths: string[], concatFilePath: string, outputPath: string): void {
  const content = sceneClipPaths
    .map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(concatFilePath, `${content}\n`, 'utf8');

  execFfmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c', 'copy',
    outputPath,
  ]);
}

function burnSubtitles(inputPath: string, srtPath: string, outputPath: string): void {
  const escaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

  execFfmpeg([
    '-i', inputPath,
    '-vf', `subtitles='${escaped}'`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    outputPath,
  ]);
}

function mixBackgroundMusic(inputPath: string, bgmPath: string, bgmVolume: number, outputPath: string): void {
  execFfmpeg([
    '-i', inputPath,
    '-stream_loop', '-1',
    '-i', bgmPath,
    '-filter_complex', `[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    '-map', '0:v:0',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outputPath,
  ]);
}

function removeTempDir(tempDir: string): void {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

export async function renderVideo(options: RenderVideoOptions): Promise<RenderVideoResult> {
  const storyPackagePath = path.resolve(options.storyPackagePath);
  const assetManifestPath = path.resolve(options.assetManifestPath);
  const storyPackage = JSON.parse(fs.readFileSync(storyPackagePath, 'utf8')) as StoryPackage;
  const assetManifest = JSON.parse(fs.readFileSync(assetManifestPath, 'utf8')) as AssetManifest;
  const runDir = resolveRunDir(storyPackagePath, options.runDir);
  const rendersDir = ensureDir(path.join(runDir, 'renders'));
  const tempDir = ensureDir(path.join(rendersDir, 'tmp'));
  const srtPath = path.join(rendersDir, 'subtitles.srt');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  const joinedVideoPath = path.join(tempDir, 'joined.mp4');
  const subtitledVideoPath = path.join(tempDir, 'subtitled.mp4');
  const renderPackagePath = path.join(runDir, 'render-package.json');
  const renderManifestPath = path.join(runDir, 'render-manifest.json');
  const finalVideoPath = path.join(rendersDir, 'final.mp4');
  const bgmPath = options.bgmPath ? path.resolve(options.bgmPath) : undefined;
  const bgmVolume = typeof options.bgmVolume === 'number' ? options.bgmVolume : 0.18;

  const sceneTracks = buildRenderTracks(storyPackage, assetManifest, runDir);
  const totalDurationSec = sceneTracks.length > 0 ? sceneTracks[sceneTracks.length - 1].endSec : 0;
  const renderPackage: RenderPackage = {
    storyId: storyPackage.id,
    aspectRatio: '9:16',
    resolution: '1080x1920',
    totalDurationSec,
    sceneTracks,
    srtPath,
    finalVideoPath,
  };

  fs.writeFileSync(srtPath, buildSrt(sceneTracks), 'utf8');
  writeJsonFile(renderPackagePath, renderPackage);

  if (options.dryRun) {
    fs.writeFileSync(finalVideoPath, JSON.stringify({
      placeholder: true,
      reason: 'render-dry-run',
      storyId: storyPackage.id,
      totalDurationSec,
      bgmPath: bgmPath ?? null,
      keepTemp: options.keepTemp ?? false,
    }, null, 2), 'utf8');
  } else {
    ensureRenderableTracks(sceneTracks);
    if (bgmPath && !fs.existsSync(bgmPath)) {
      throw new Error(`Background music file not found: ${bgmPath}`);
    }

    const sceneClipPaths = renderSceneClips(sceneTracks, tempDir);
    concatClips(sceneClipPaths, concatFilePath, joinedVideoPath);
    burnSubtitles(joinedVideoPath, srtPath, subtitledVideoPath);

    if (bgmPath) {
      mixBackgroundMusic(subtitledVideoPath, bgmPath, bgmVolume, finalVideoPath);
    } else {
      fs.copyFileSync(subtitledVideoPath, finalVideoPath);
    }

    if (!options.keepTemp) {
      removeTempDir(tempDir);
    }
  }

  const renderManifest: RenderManifest = {
    storyPackageId: storyPackage.id,
    generatedAt: new Date().toISOString(),
    finalVideoPath,
    subtitlesPath: srtPath,
    durationSec: totalDurationSec,
  };

  writeJsonFile(renderManifestPath, renderManifest);

  return {
    storyPackage,
    assetManifest,
    renderPackage,
    renderManifest,
    renderPackagePath,
    renderManifestPath,
    srtPath,
    runDir,
  };
}

export function formatRenderVideoResult(result: RenderVideoResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'render-video',
    storyId: result.storyPackage.id,
    runDir: result.runDir,
    sceneTracks: result.renderPackage.sceneTracks.length,
    totalDurationSec: result.renderPackage.totalDurationSec,
    srtPath: result.srtPath,
    renderPackagePath: result.renderPackagePath,
    renderManifestPath: result.renderManifestPath,
    finalVideoPath: result.renderManifest.finalVideoPath,
  }, null, 2);
}
