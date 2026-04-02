export interface DiversifiedTopic {
  niche: string;
  weightedScore: number;
  totalScore: number;
  [key: string]: any;
}

export interface DiversityOptions {
  count: number;
  maxPerNiche?: number;
  minDistinctNiches?: number;
}

function sortByScore<T extends DiversifiedTopic>(topics: T[]): T[] {
  return [...topics].sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
    return b.totalScore - a.totalScore;
  });
}

export function diversifyTopics<T extends DiversifiedTopic>(topics: T[], options: DiversityOptions): T[] {
  const count = options.count;
  const maxPerNiche = options.maxPerNiche ?? 1;
  const minDistinctNiches = Math.min(options.minDistinctNiches ?? count, count);
  const sorted = sortByScore(topics);
  const nicheCounts = new Map<string, number>();
  const selected: T[] = [];

  for (const topic of sorted) {
    if (selected.length >= count) break;
    const current = nicheCounts.get(topic.niche) ?? 0;
    if (current >= maxPerNiche) continue;
    selected.push(topic);
    nicheCounts.set(topic.niche, current + 1);
  }

  const distinctNiches = new Set(selected.map(item => item.niche)).size;
  if (selected.length === count && distinctNiches >= minDistinctNiches) {
    return selected;
  }

  const fallback: T[] = [];
  const strictNiches = new Set<string>();
  for (const topic of sorted) {
    if (fallback.length >= count) break;
    if (strictNiches.has(topic.niche) && strictNiches.size < minDistinctNiches) continue;
    fallback.push(topic);
    strictNiches.add(topic.niche);
  }

  if (fallback.length >= count) {
    return fallback.slice(0, count);
  }

  const seen = new Set(fallback.map(item => `${item.niche}::${item.topic}`));
  for (const topic of sorted) {
    if (fallback.length >= count) break;
    const key = `${topic.niche}::${topic.topic}`;
    if (seen.has(key)) continue;
    fallback.push(topic);
    seen.add(key);
  }

  return fallback.slice(0, count);
}
