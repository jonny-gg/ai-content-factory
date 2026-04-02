import * as fs from 'fs';
import * as path from 'path';
import { resolveStoryRun } from './src/story-factory';

interface BatchItem {
  niche?: string;
  topic: string;
  platform?: 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';
  durationSeconds?: number;
  generateImages?: boolean;
  style?: string;
}

interface BatchConfig {
  items: BatchItem[];
}

async function main() {
  const configPath = process.argv[2] || path.join(process.cwd(), 'configs', 'story-batch.json');
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content) as BatchConfig;

  const results = config.items.map((item) => {
    const resolved = resolveStoryRun({
      topic: item.topic,
      style: item.style,
    });

    return {
      niche: item.niche ?? 'general',
      topic: item.topic,
      platform: item.platform || 'douyin',
      durationSeconds: item.durationSeconds || 60,
      generateImages: Boolean(item.generateImages),
      hasTemplate: resolved.template.length > 0,
      outputDir: resolved.config.outputDir,
      mode: 'resolved-only'
    };
  });

  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, `batch-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(JSON.stringify({
    count: results.length,
    summaryPath,
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
