import * as fs from 'fs';
import * as path from 'path';
import { diversifyTopics } from './src/topic-diversifier';

interface Weights {
  speedToProduce: number;
  commercialIntent: number;
  viralPotential: number;
  seriesPotential: number;
  conversionPotential: number;
  competitionGap: number;
}

type ScoreKey = keyof Weights;

type ScoreMap = Record<ScoreKey, number>;

interface NicheRubric extends ScoreMap {
  recommendedOffers: string[];
}

interface TopicModifier {
  name: string;
  keywords: string[];
  bonus: Partial<ScoreMap>;
}

interface MonetizationRubric {
  weights: Weights;
  nicheScores: Record<string, NicheRubric>;
  topicModifiers: TopicModifier[];
}

interface RankedTopic {
  niche: string;
  topic: string;
  totalScore: number;
  weightedScore: number;
  scoreBreakdown: ScoreMap;
  triggers: string[];
  recommendedOffers: string[];
  executionPlan: {
    hook: string;
    angle: string;
    cta: string;
  };
}

const SCORE_KEYS: ScoreKey[] = [
  'speedToProduce',
  'commercialIntent',
  'viralPotential',
  'seriesPotential',
  'conversionPotential',
  'competitionGap'
];

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, value));
}

function createExecutionPlan(topic: string, niche: string, offers: string[]) {
  const primaryOffer = offers[0] || '故事脚本包';
  return {
    hook: `如果你刷到《${topic}》，前3秒必须直接抛冲突，不要铺垫。`,
    angle: `主打${niche}赛道，用低成本场景+强反转/强悬念去测试完播率。`,
    cta: `结尾引导：想要同类型可直接发布的素材包，评论或私信领取《${primaryOffer}》。`
  };
}

function rankTopics(bank: Record<string, string[]>, rubric: MonetizationRubric): RankedTopic[] {
  const ranked: RankedTopic[] = [];

  for (const [niche, topics] of Object.entries(bank)) {
    const base = rubric.nicheScores[niche];
    if (!base) continue;

    for (const topic of topics) {
      const scoreBreakdown: ScoreMap = {
        speedToProduce: base.speedToProduce,
        commercialIntent: base.commercialIntent,
        viralPotential: base.viralPotential,
        seriesPotential: base.seriesPotential,
        conversionPotential: base.conversionPotential,
        competitionGap: base.competitionGap,
      };

      const triggers: string[] = [];

      for (const modifier of rubric.topicModifiers) {
        const matched = modifier.keywords.some(keyword => topic.includes(keyword));
        if (!matched) continue;

        triggers.push(modifier.name);
        for (const key of SCORE_KEYS) {
          const bonus = modifier.bonus[key] ?? 0;
          scoreBreakdown[key] = clampScore(scoreBreakdown[key] + bonus);
        }
      }

      const weightedScore = SCORE_KEYS.reduce((sum, key) => {
        return sum + scoreBreakdown[key] * rubric.weights[key];
      }, 0);

      const totalScore = SCORE_KEYS.reduce((sum, key) => sum + scoreBreakdown[key], 0);

      ranked.push({
        niche,
        topic,
        totalScore,
        weightedScore: Number(weightedScore.toFixed(2)),
        scoreBreakdown,
        triggers,
        recommendedOffers: base.recommendedOffers,
        executionPlan: createExecutionPlan(topic, niche, base.recommendedOffers)
      });
    }
  }

  return ranked.sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
    return b.totalScore - a.totalScore;
  });
}

function main() {
  const count = Number(process.argv[2] || 10);
  const diversified = process.argv.includes('--diverse');
  const maxPerNicheArg = process.argv.find(arg => arg.startsWith('--max-per-niche='));
  const minDistinctArg = process.argv.find(arg => arg.startsWith('--min-distinct='));
  const maxPerNiche = Number(maxPerNicheArg?.split('=')[1] || 1);
  const minDistinctNiches = Number(minDistinctArg?.split('=')[1] || Math.min(count, 3));
  const bankPath = path.join(process.cwd(), 'configs', 'topic-bank.json');
  const rubricPath = path.join(process.cwd(), 'configs', 'monetization-rubric.json');
  const outputDir = path.join(process.cwd(), 'output');

  const bank = loadJson<Record<string, string[]>>(bankPath);
  const rubric = loadJson<MonetizationRubric>(rubricPath);
  const ranked = rankTopics(bank, rubric);
  const top = diversified
    ? diversifyTopics(ranked, { count, maxPerNiche, minDistinctNiches })
    : ranked.slice(0, count);

  fs.mkdirSync(outputDir, { recursive: true });
  const timestamp = Date.now();
  const jsonPath = path.join(outputDir, `monetized-topics-${timestamp}.json`);
  const mdPath = path.join(outputDir, `monetized-topics-${timestamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: top.length, diversified, diversityOptions: diversified ? { maxPerNiche, minDistinctNiches } : null, topics: top }, null, 2), 'utf-8');

  const md = [
    '# Top Monetizable Topics',
    '',
    `生成时间：${new Date().toISOString()}`,
    diversified ? `多样性模式：开启（maxPerNiche=${maxPerNiche}, minDistinctNiches=${minDistinctNiches}）` : '多样性模式：关闭',
    '',
    ...top.flatMap((item, index) => [
      `## ${index + 1}. ${item.topic}`,
      `- 赛道：${item.niche}`,
      `- 综合分：${item.weightedScore} / 10`,
      `- 维度分：speed=${item.scoreBreakdown.speedToProduce}, commercial=${item.scoreBreakdown.commercialIntent}, viral=${item.scoreBreakdown.viralPotential}, series=${item.scoreBreakdown.seriesPotential}, conversion=${item.scoreBreakdown.conversionPotential}, gap=${item.scoreBreakdown.competitionGap}`,
      `- 触发器：${item.triggers.length ? item.triggers.join(', ') : '无'}`,
      `- 推荐变现：${item.recommendedOffers.join(' / ')}`,
      `- Hook：${item.executionPlan.hook}`,
      `- 角度：${item.executionPlan.angle}`,
      `- CTA：${item.executionPlan.cta}`,
      ''
    ])
  ].join('\n');

  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(JSON.stringify({ ok: true, count: top.length, jsonPath, mdPath, top }, null, 2));
}

main();
