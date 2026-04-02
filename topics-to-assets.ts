import * as fs from 'fs';
import * as path from 'path';
import { createExecutionPack, type RankedTopicInput } from './src/topic-execution-pack';

type SupportedPlatform = 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';

function parseBooleanFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function main() {
  const count = Number(process.argv[2] || 3);
  const platform = (process.argv[3] || 'douyin') as SupportedPlatform;
  const preferDiversified = parseBooleanFlag('--prefer-diverse');
  const onlyDiversified = parseBooleanFlag('--diverse-only');
  const outputDir = path.join(process.cwd(), 'output');

  const rankedFiles = fs.readdirSync(outputDir)
    .filter(name => name.startsWith('monetized-topics-') && name.endsWith('.json'))
    .map(name => {
      const fullPath = path.join(outputDir, name);
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as { diversified?: boolean; topics: RankedTopicInput[] };
      return {
        name,
        fullPath,
        diversified: Boolean(parsed.diversified),
        topics: parsed.topics,
        mtime: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (!rankedFiles.length) {
    throw new Error('No monetized topics found. Run `npm run topics:monetize -- 10` first.');
  }

  let latest = rankedFiles[0];
  if (onlyDiversified) {
    const diversifiedFile = rankedFiles.find(file => file.diversified);
    if (!diversifiedFile) {
      throw new Error('No diversified monetized topics found. Run `npm run topics:monetize:diverse` first.');
    }
    latest = diversifiedFile;
  } else if (preferDiversified) {
    latest = rankedFiles.find(file => file.diversified) || rankedFiles[0];
  }

  const result = createExecutionPack(latest.topics, { outputDir, platform, count });

  console.log(JSON.stringify({
    ok: true,
    source: latest.fullPath,
    diversified: latest.diversified,
    ...result
  }, null, 2));
}

main();
