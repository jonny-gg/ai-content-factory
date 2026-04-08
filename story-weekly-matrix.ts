import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type StoryPlatform = 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';
type StoryNiche = 'horror' | 'twist' | 'anime';

function parseArgs(argv: string[]): { platform: StoryPlatform; days: number; dryRun: boolean } {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  return {
    platform: (positional[0] || 'douyin') as StoryPlatform,
    days: Number(positional[1] || 3),
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const { platform, days, dryRun } = parseArgs(process.argv.slice(2));
  const niches: StoryNiche[] = ['horror', 'twist', 'anime'];
  const matrixDir = path.join(process.cwd(), 'output', 'weekly-matrix', `${platform}_${Date.now()}`);
  fs.mkdirSync(matrixDir, { recursive: true });

  const results: Array<{ niche: StoryNiche; output: string }> = [];

  for (const niche of niches) {
    const command = ['npx', 'ts-node', 'story-weekly.ts', niche, platform, String(days), ...(dryRun ? ['--dry-run'] : [])].join(' ');
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const filePath = path.join(matrixDir, `${niche}.json`);
    fs.writeFileSync(filePath, output, 'utf-8');
    results.push({ niche, output: filePath });
  }

  fs.writeFileSync(path.join(matrixDir, 'matrix-summary.json'), JSON.stringify({ dryRun, results }, null, 2), 'utf-8');
  console.log(JSON.stringify({ matrixDir, dryRun, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
