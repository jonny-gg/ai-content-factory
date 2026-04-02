import * as fs from 'fs';
import * as path from 'path';
import { buildPlatformGuidance, type SupportedPlatform } from './platform-template';
import { writeDeliveryChecklist } from './delivery-kit';

export interface RankedTopicInput {
  niche: string;
  topic: string;
  weightedScore: number;
  recommendedOffers: string[];
  executionPlan: {
    hook: string;
    angle: string;
    cta: string;
  };
}

export interface ExecutionPackOptions {
  outputDir: string;
  platform?: SupportedPlatform;
  count?: number;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'topic';
}

function inferScenes(topic: RankedTopicInput) {
  return [
    `开场3秒：直接抛出冲突——${topic.topic}`,
    '中段15秒：补一条反常细节，让观众确认“事情不对劲”。',
    '中后段20秒：升级冲突，制造新的信息差或误导。',
    `结尾10秒：反转/留悬念，并接上CTA——${topic.executionPlan.cta}`
  ];
}

function buildTitles(topic: RankedTopicInput): string[] {
  return [
    `${topic.topic}：这个结局大多数人猜不到`,
    `如果是你，看到${topic.topic}还敢继续吗？`,
    `我建议所有做${topic.niche}内容的人都试试这个题`
  ];
}

function buildCaption(topic: RankedTopicInput, platform: SupportedPlatform): string {
  const offer = topic.recommendedOffers[0] || '脚本包';
  return [
    `题材：${topic.topic}`,
    `定位：${topic.niche}赛道，综合分 ${topic.weightedScore}/10`,
    `核心钩子：${topic.executionPlan.hook}`,
    `结尾转化：${topic.executionPlan.cta}`,
    `适合承接：${offer}`,
    buildPlatformGuidance(platform)
  ].join('\n');
}

function buildPublishCopy(topic: RankedTopicInput): string {
  return [
    `标题建议：${buildTitles(topic)[0]}`,
    '',
    '口播开头：',
    `“${topic.topic}这类题，最狠的不是吓人，是它特别容易让人看到最后。”`,
    '',
    '内容骨架：',
    ...inferScenes(topic).map((line, index) => `${index + 1}. ${line}`),
    '',
    '结尾引导：',
    topic.executionPlan.cta,
  ].join('\n');
}

export function createExecutionPack(topics: RankedTopicInput[], options: ExecutionPackOptions) {
  const platform = options.platform || 'douyin';
  const count = options.count || 3;
  const selected = topics.slice(0, count);
  const runDir = path.join(options.outputDir, `execution-pack-${Date.now()}`);
  ensureDir(runDir);

  const summary = selected.map((topic, index) => {
    const dir = path.join(runDir, `${String(index + 1).padStart(2, '0')}-${safeSlug(topic.topic)}`);
    ensureDir(dir);

    const storyPackage = {
      topic: topic.topic,
      niche: topic.niche,
      score: topic.weightedScore,
      titles: buildTitles(topic),
      hook: topic.executionPlan.hook,
      angle: topic.executionPlan.angle,
      cta: topic.executionPlan.cta,
      recommendedOffers: topic.recommendedOffers,
      scenes: inferScenes(topic),
      platform,
      platformGuidance: buildPlatformGuidance(platform)
    };

    fs.writeFileSync(path.join(dir, 'story-package.json'), JSON.stringify(storyPackage, null, 2), 'utf-8');
    fs.writeFileSync(path.join(dir, 'publish-copy.txt'), buildPublishCopy(topic), 'utf-8');
    fs.writeFileSync(path.join(dir, 'shot-list.md'), inferScenes(topic).map((line, i) => `## Shot ${i + 1}\n- ${line}\n`).join('\n'), 'utf-8');
    fs.writeFileSync(path.join(dir, 'platform-copies.json'), JSON.stringify({
      platform,
      caption: buildCaption(topic, platform),
      titles: buildTitles(topic)
    }, null, 2), 'utf-8');

    writeDeliveryChecklist({
      exportDir: dir,
      title: buildTitles(topic)[0],
      topic: topic.topic,
      niche: topic.niche,
    });

    return {
      rank: index + 1,
      topic: topic.topic,
      niche: topic.niche,
      score: topic.weightedScore,
      dir,
    };
  });

  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    platform,
    count: summary.length,
    items: summary
  }, null, 2), 'utf-8');

  return {
    runDir,
    platform,
    count: summary.length,
    items: summary
  };
}
