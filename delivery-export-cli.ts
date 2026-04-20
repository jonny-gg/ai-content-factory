#!/usr/bin/env node
import { Command } from 'commander';
import { runDeliveryExportCli } from './src/delivery-export-factory';

async function main() {
  const program = new Command();

  program
    .option('--run-dir <path>', 'Existing run directory containing manifests')
    .option('--story-package <path>', 'Path to story-package.json')
    .option('--asset-manifest <path>', 'Path to asset-manifest.json')
    .option('--render-manifest <path>', 'Path to render-manifest.json');

  program.parse(process.argv);
  const options = program.opts();

  await runDeliveryExportCli({
    runDir: options.runDir,
    storyPackagePath: options.storyPackage,
    assetManifestPath: options.assetManifest,
    renderManifestPath: options.renderManifest,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
