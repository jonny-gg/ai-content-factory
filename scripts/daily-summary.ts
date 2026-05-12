import * as fs from 'fs';
import * as path from 'path';

interface RankedTopic {
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

interface RankedFile {
  generatedAt: string;
  diversified?: boolean;
  diversityOptions?: {
    maxPerNiche: number;
    minDistinctNiches: number;
  } | null;
  topics: RankedTopic[];
}

interface ExecutionSummaryItem {
  rank: number;
  topic: string;
  niche: string;
  score: number;
  dir: string;
}

interface ExecutionSummary {
  generatedAt: string;
  platform: string;
  count: number;
  items: ExecutionSummaryItem[];
}

function latestMatch(dir: string, predicate: (name: string) => boolean) {
  const entries = fs.readdirSync(dir)
    .filter(predicate)
    .map(name => ({
      name,
      fullPath: path.join(dir, name),
      mtime: fs.statSync(path.join(dir, name)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return entries[0] || null;
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function inferPrimaryGoal(niche: string): string {
  if (['horror', 'twist', 'anime'].includes(niche)) return '测播放/完播';
  if (['female', 'emotion'].includes(niche)) return '测评论/私信';
  return '测综合数据';
}

function inferPublishWindow(rank: number): string {
  if (rank === 1) return '中午 12:00-13:30';
  if (rank === 2) return '晚上 18:30-20:00';
  return '晚上 21:00-22:30';
}

function inferReason(item: RankedTopic): string {
  if (item.niche === 'twist') return '强反转题材，适合先打完播率，拿第一波测试数据。';
  if (item.niche === 'horror') return '天然带悬念和停留，适合补第二条，拉高停留和讨论。';
  if (item.niche === 'anime') return '设定感强，容易做差异化，适合第三条测收藏和兴趣人群。';
  return '题材均衡，适合补充今天的内容测试组合。';
}

function main() {
  const outputDir = path.join(process.cwd(), 'output');
  const rankedFile = latestMatch(outputDir, name => name.startsWith('monetized-topics-') && name.endsWith('.json'));
  const executionDir = latestMatch(outputDir, name => name.startsWith('execution-pack-'));

  if (!rankedFile) throw new Error('No monetized topics found.');
  if (!executionDir) throw new Error('No execution pack found.');

  const ranked = loadJson<RankedFile>(rankedFile.fullPath);
  const executionSummary = loadJson<ExecutionSummary>(path.join(executionDir.fullPath, 'summary.json'));

  const merged = executionSummary.items.map(item => {
    const rankedTopic = ranked.topics.find(topic => topic.topic === item.topic);
    if (!rankedTopic) {
      throw new Error(`Topic not found in ranked file: ${item.topic}`);
    }

    return {
      rank: item.rank,
      topic: item.topic,
      niche: item.niche,
      score: item.score,
      assetDir: path.relative(outputDir, item.dir),
      primaryOffer: rankedTopic.recommendedOffers[0] || '素材包',
      backupOffers: rankedTopic.recommendedOffers.slice(1),
      publishWindow: inferPublishWindow(item.rank),
      primaryGoal: inferPrimaryGoal(item.niche),
      hook: rankedTopic.executionPlan.hook,
      angle: rankedTopic.executionPlan.angle,
      cta: rankedTopic.executionPlan.cta,
      reason: inferReason(rankedTopic)
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    rankedSource: path.basename(rankedFile.fullPath),
    executionSource: path.basename(executionDir.fullPath),
    diversified: Boolean(ranked.diversified),
    platform: executionSummary.platform,
    items: merged
  };

  const timestamp = Date.now();
  const jsonPath = path.join(outputDir, `daily-summary-${timestamp}.json`);
  const mdPath = path.join(outputDir, `daily-summary-${timestamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

  const md = [
    '# Daily Content Dashboard',
    '',
    `生成时间：${summary.generatedAt}`,
    `平台：${summary.platform}`,
    `选题来源：${summary.rankedSource}`,
    `执行包来源：${summary.executionSource}`,
    `多样性模式：${summary.diversified ? '是' : '否'}`,
    '',
    '## 今日发布顺序建议',
    '',
    ...merged.flatMap(item => [
      `### ${item.rank}. ${item.topic}`,
      `- 赛道：${item.niche}`,
      `- 分数：${item.score} / 10`,
      `- 建议先发时段：${item.publishWindow}`,
      `- 今日主目标：${item.primaryGoal}`,
      `- 主推 offer：${item.primaryOffer}`,
      `- 备选 offer：${item.backupOffers.length ? item.backupOffers.join(' / ') : '无'}`,
      `- 推荐理由：${item.reason}`,
      `- Hook：${item.hook}`,
      `- 角度：${item.angle}`,
      `- CTA：${item.cta}`,
      `- 素材目录：${item.assetDir}`,
      ''
    ])
  ].join('\n');

  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(JSON.stringify({ ok: true, jsonPath, mdPath, summary }, null, 2));
}

main();
