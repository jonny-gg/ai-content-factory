import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getConsoleRunDetail, getDashboardData, listConsoleRuns } from '../src/ops-console/artifact-store';

function writeJson(filePath: string, data: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeText(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function run(): void {
  const repoRoot = mkdtempSync(join(tmpdir(), 'ops-console-artifact-store-'));

  try {
    const storyRunId = '2026-05-13T00-00-00-000Z-demo-topic';
    const storyRunDir = join(repoRoot, 'output', 'runs', storyRunId);
    writeJson(join(storyRunDir, 'story-package.json'), {
      id: 'story-1',
      createdAt: '2026-05-13T00:00:00.000Z',
      platform: 'douyin',
      niche: 'twist',
      topic: '演示主题',
      genre: 'short-drama',
      language: 'zh-CN',
      title: '演示故事标题',
      hook: '一个钩子',
      summary: '一个摘要',
      cta: '一个 CTA',
      characters: [],
      scenes: [{ sceneId: 'scene-1', order: 1, durationSec: 8, purpose: 'hook', visualPrompt: 'prompt' }],
      publish: {
        caption: 'caption',
        hashtags: ['#demo']
      },
      metricsTarget: {}
    });
    writeJson(join(storyRunDir, 'publish-meta.json'), { caption: 'caption', hashtags: ['#demo'] });
    writeText(join(storyRunDir, 'publish-copy.txt'), 'publish copy');
    writeText(join(storyRunDir, 'shot-list.md'), '# shot list');
    writeText(join(storyRunDir, 'delivery-checklist.md'), '# checklist');

    const executionPackDir = join(repoRoot, 'output', 'execution-pack-1770000000000');
    writeJson(join(executionPackDir, 'summary.json'), {
      generatedAt: '2026-05-13T01:00:00.000Z',
      platform: 'douyin',
      count: 1,
      items: [{ rank: 1, topic: '题材一', niche: 'twist', score: 8.8, dir: join(executionPackDir, '01-topic') }]
    });
    writeJson(join(executionPackDir, '01-topic', 'story-package.json'), {
      topic: '题材一',
      niche: 'twist',
      titles: ['标题一'],
      hook: 'hook',
      angle: 'angle',
      cta: 'cta',
      recommendedOffers: ['offer'],
      scenes: ['scene 1'],
      platform: 'douyin'
    });
    writeText(join(executionPackDir, '01-topic', 'publish-copy.txt'), 'execution publish copy');

    const dailyRunDir = join(repoRoot, 'output', '2026-05-13', 'daily-run-1770000000123');
    writeJson(join(dailyRunDir, 'run-meta.json'), {
      runId: '1770000000123',
      startedAt: '2026-05-13T02:00:00.000Z',
      dryRun: true,
      steps: []
    });

    const weeklyPackageDir = join(repoRoot, 'output', 'weekly-packages', 'twist_douyin_1770000000222');
    writeJson(join(weeklyPackageDir, 'weekly-plan.json'), {
      niche: 'twist',
      platform: 'douyin',
      days: 7,
      items: [{ day: 1, topic: 'day 1' }]
    });

    const weeklyMatrixDir = join(repoRoot, 'output', 'weekly-matrix', 'douyin_1770000000333');
    writeJson(join(weeklyMatrixDir, 'matrix-summary.json'), {
      results: [{ niche: 'twist' }, { niche: 'anime' }]
    });

    writeJson(join(repoRoot, 'output', '.ops-console', 'tasks.json'), [
      {
        id: 'story-task-1',
        workflow: 'story',
        label: 'Story · 演示主题',
        status: 'succeeded',
        createdAt: '2026-05-13T03:00:00.000Z',
        command: 'story',
        args: ['--topic', '演示主题'],
        params: { topic: '演示主题' },
        latestRunId: storyRunId
      }
    ]);

    const runs = listConsoleRuns({ repoRoot });
    assert.equal(runs.length, 5);
    assert.equal(runs.some((run) => run.kind === 'story' && run.id === storyRunId), true);
    assert.equal(runs.some((run) => run.kind === 'execution-pack'), true);
    assert.equal(runs.some((run) => run.kind === 'daily'), true);
    assert.equal(runs.some((run) => run.kind === 'weekly-package'), true);
    assert.equal(runs.some((run) => run.kind === 'weekly-matrix'), true);

    const detail = getConsoleRunDetail(storyRunId, { repoRoot });
    assert.ok(detail);
    assert.equal(detail?.relativeRunDir, path.join('output', 'runs', storyRunId));
    assert.equal(detail?.artifacts.some((artifact) => artifact.relativePath.endsWith('story-package.json')), true);
    assert.equal(detail?.viewer?.textFiles?.some((file) => file.label === 'publish-copy.txt'), true);
    assert.equal(detail?.viewer?.textFiles?.some((file) => file.label === 'shot-list.md'), true);

    const dashboard = getDashboardData({ repoRoot });
    assert.equal(dashboard.recentRuns.length, 5);
    assert.equal(dashboard.latestByKind.story?.id, storyRunId);
    assert.equal(dashboard.tasks[0]?.latestRunId, storyRunId);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

run();
console.log('ops-console artifact-store tests passed');
