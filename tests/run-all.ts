import { readdirSync } from 'fs';
import { join, resolve } from 'path';

async function main(): Promise<void> {
  const testsDir = __dirname;
  const files = readdirSync(testsDir)
    .filter((file) => file.endsWith('.test.ts'))
    .sort();

  for (const file of files) {
    const fullPath = resolve(join(testsDir, file));
    console.log(`\n== running ${file} ==`);
    await import(fullPath);
  }

  console.log(`\nRan ${files.length} test file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
