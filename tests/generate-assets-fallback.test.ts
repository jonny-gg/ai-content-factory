import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { StoryPackage } from '../src/core/types';
import { generateAssets } from '../src/pipelines/generate-assets';

async function run(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'generate-assets-fallback-test-'));

  try {
    const storyPackage: StoryPackage = {
      id: 'story-test',
      createdAt: '2026-05-22T00:00:00.000Z',
      platform: 'douyin',
      niche: 'test',
      topic: 'fallback assets',
      genre: 'test',
      language: 'zh-CN',
      title: 'Fallback Assets',
      hook: 'hook',
      summary: 'summary',
      cta: 'cta',
      characters: [],
      scenes: [{
        sceneId: 'scene-1',
        order: 1,
        durationSec: 2,
        purpose: 'hook',
        narration: 'fallback narration',
        visualPrompt: 'fallback visual prompt',
      }],
      publish: {
        caption: 'caption',
        hashtags: [],
      },
      metricsTarget: {},
    };
    const storyPackagePath = join(dir, 'story-package.json');
    writeFileSync(storyPackagePath, JSON.stringify(storyPackage, null, 2));

    const result = await generateAssets({
      storyPackagePath,
      dryRun: true,
    });

    assert.equal(result.assetManifest.images.length, 1);
    assert.equal(result.assetManifest.audio.length, 1);
    assert.ok(existsSync(result.assetManifestPath));

    const imagePath = result.assetManifest.images[0].path;
    const image = readFileSync(imagePath);
    assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

    const audioPath = result.assetManifest.audio[0].path;
    const audio = readFileSync(audioPath);
    assert.ok(audioPath.endsWith('.wav'));
    assert.equal(audio.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(audio.subarray(8, 12).toString('ascii'), 'WAVE');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

run()
  .then(() => {
    console.log('generate assets fallback tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
