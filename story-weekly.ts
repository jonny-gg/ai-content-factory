import * as fs from 'fs';
import * as path from 'path';
import { resolveStoryRun } from './src/story-factory';

type StoryPlatform = 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';
type StoryNiche = 'horror' | 'twist' | 'anime' | 'general';

function pickWithoutReplacement(items: string[], count: number): string[] {
  const pool = [...items];
  const result: string[] = [];

  while (pool.length && result.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [picked] = pool.splice(index, 1);
    if (picked) result.push(picked);
  }

  return result;
}

function parseArgs(argv: string[]): { niche: StoryNiche; platform: StoryPlatform; days: number; dryRun: boolean } {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  return {
    niche: (positional[0] || 'horror') as StoryNiche,
    platform: (positional[1] || 'douyin') as StoryPlatform,
    days: Number(positional[2] || 7),
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const { niche, platform, days, dryRun } = parseArgs(process.argv.slice(2));

  const bankPath = path.join(process.cwd(), 'configs', 'topic-bank.json');
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf-8')) as Record<string, string[]>;
  const topics = bank[niche] || [];

  if (!topics.length) {
    throw new Error(`No topics found for niche: ${niche}`);
  }

  const selectedTopics = pickWithoutReplacement(topics, days);
  const weeklyId = `${niche}_${platform}_${Date.now()}`;
  const weeklyDir = path.join(process.cwd(), 'output', 'weekly-packages', weeklyId);
  fs.mkdirSync(weeklyDir, { recursive: true });

  const items = selectedTopics.map((topic, index) => {
    const resolved = resolveStoryRun({ topic, style: niche, dryRun });
    return {
      day: index + 1,
      topic,
      title: topic,
      exportDir: resolved.config.outputDir,
      generationMode: dryRun ? 'dry-run' : 'resolved-only',
      hashtags: [`#${niche}`, '#短视频', '#AI内容'],
      hasTemplate: resolved.template.length > 0,
    };
  });

  const weeklySummary = {
    niche,
    platform,
    days: items.length,
    weeklyDir,
    dryRun,
    items
  };

  fs.writeFileSync(path.join(weeklyDir, 'weekly-plan.json'), JSON.stringify(weeklySummary, null, 2), 'utf-8');

  const markdown = [
    '# Weekly Story Package',
    '',
    `- Niche: ${niche}`,
    `- Platform: ${platform}`,
    `- Days: ${items.length}`,
    `- DryRun: ${dryRun}`,
    '',
    '## Schedule',
    ...items.map(item => `### Day ${item.day}\n- Topic: ${item.topic}\n- Title: ${item.title}\n- Mode: ${item.generationMode}\n- OutputDir: ${item.exportDir}\n- Tags: ${item.hashtags.join(' ')}`)
  ].join('\n\n');

  fs.writeFileSync(path.join(weeklyDir, 'weekly-plan.md'), markdown, 'utf-8');

  const deliveryNote = [
    '# Weekly Delivery Note',
    '',
    '交付内容：',
    '- 每日选题计划',
    '- 每条的主题/标签/基础配置预检',
    '',
    '建议执行方式：',
    '1. 每天发布 1 条',
    '2. 优先测前 3 秒 hook 的点击率',
    '3. 根据评论区反馈调整下一周赛道',
    '4. 复用高表现标题结构',
    '',
    '建议数据跟踪：',
    '- 播放量',
    '- 完播率',
    '- 点赞率',
    '- 评论率',
    '- 涨粉数'
  ].join('\n');

  fs.writeFileSync(path.join(weeklyDir, 'delivery-note.md'), deliveryNote, 'utf-8');

  console.log(JSON.stringify(weeklySummary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
