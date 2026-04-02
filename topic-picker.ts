import * as fs from 'fs';
import * as path from 'path';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  const niche = process.argv[2] || 'horror';
  const count = Number(process.argv[3] || 5);
  const bankPath = path.join(process.cwd(), 'configs', 'topic-bank.json');
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf-8')) as Record<string, string[]>;
  const topics = bank[niche] || [];

  if (!topics.length) {
    throw new Error(`No topics found for niche: ${niche}`);
  }

  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(count, shuffled.length));
  console.log(JSON.stringify({ niche, picks }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
