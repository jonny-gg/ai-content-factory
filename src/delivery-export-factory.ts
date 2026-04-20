import fs from 'node:fs';
import path from 'node:path';
import { exportDeliveryPackage, formatDeliveryExportResult, type DeliveryExportOptions } from './delivery-kit';

export interface DeliveryExportCliOptions extends DeliveryExportOptions {
  runDir?: string;
}

function resolvePathWithinRunDir(runDir: string, filename: string): string {
  return path.join(runDir, filename);
}

export async function runDeliveryExportCli(options?: DeliveryExportCliOptions): Promise<void> {
  const runDir = options?.runDir ? path.resolve(options.runDir) : undefined;

  const storyPackagePath = options?.storyPackagePath ?? (runDir ? resolvePathWithinRunDir(runDir, 'story-package.json') : undefined);
  const assetManifestPath = options?.assetManifestPath ?? (runDir ? resolvePathWithinRunDir(runDir, 'asset-manifest.json') : undefined);
  const renderManifestPath = options?.renderManifestPath ?? (runDir ? resolvePathWithinRunDir(runDir, 'render-manifest.json') : undefined);

  if (!storyPackagePath) {
    throw new Error('Missing required --story-package or --run-dir for delivery export.');
  }

  const result = await exportDeliveryPackage({
    storyPackagePath,
    assetManifestPath: assetManifestPath && fs.existsSync(assetManifestPath) ? assetManifestPath : undefined,
    renderManifestPath: renderManifestPath && fs.existsSync(renderManifestPath) ? renderManifestPath : undefined,
    runDir,
  });

  console.log(formatDeliveryExportResult(result));
}
