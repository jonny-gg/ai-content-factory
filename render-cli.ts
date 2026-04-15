import { Command } from 'commander';
import { runRenderVideoCli } from './src/render-factory';

async function main() {
  const program = new Command();

  program
    .option('--story-package <path>', 'Path to story-package.json')
    .option('--asset-manifest <path>', 'Path to asset-manifest.json')
    .option('--run-dir <path>', 'Override output run directory')
    .option('--dry-run', 'Write placeholder final output instead of running real render', false);

  program.parse(process.argv);
  const options = program.opts();

  await runRenderVideoCli({
    storyPackagePath: options.storyPackage,
    assetManifestPath: options.assetManifest,
    runDir: options.runDir,
    dryRun: options.dryRun,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
