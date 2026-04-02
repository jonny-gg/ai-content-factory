import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type StoryPlatform = 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';
type StoryNiche = 'horror' | 'twist' | 'anime';

async function main() {
  const platform = (process.argv[2] || 'douyin') as StoryPlatform;
  const days = Number(process.argv[3] || 3);
  const niches: StoryNiche[] = ['horror', 'twist', 'anime'];
  const matrixDir = path.join(process.cwd(), 'output', 'weekly-matrix', `${platform}_${Date.now()}`);
  fs.mkdirSync(matrixDir, { recursive: true });

  const results: Array<{ niche: StoryNiche; output: string }> = [];

  for (const niche of niches) {
    const output = execSync(`npx ts-node story-weekly.ts ${niche} ${platform} ${days}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const filePath = path.join(matrixDir, `${niche}.json`);
    fs.writeFileSync(filePath, output, 'utf-8');
    results.push({ niche, output: filePath });
  }

  fs.writeFileSync(path.join(matrixDir, 'matrix-summary.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log(JSON.stringify({ matrixDir, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
