import * as fs from 'fs';
import * as path from 'path';

export interface DeliveryChecklistInput {
  exportDir: string;
  title?: string;
  topic?: string;
  niche?: string;
  audioFiles?: string[];
  imageFiles?: string[];
}

export function writeDeliveryChecklist(input: DeliveryChecklistInput): void {
  const audioFiles = input.audioFiles ?? [];
  const imageFiles = input.imageFiles ?? [];

  const lines = [
    '# Delivery Checklist',
    '',
    `Title: ${input.title ?? 'Untitled'}`,
    `Topic: ${input.topic ?? 'N/A'}`,
    `Niche: ${input.niche ?? 'N/A'}`,
    '',
    '## Files',
    '- story-package.json',
    '- publish-copy.txt',
    '- platform-copies.json',
    '- shot-list.md',
    ...audioFiles.map(file => `- ${path.basename(file)}`),
    ...imageFiles.map(file => `- ${path.basename(file)}`),
    '',
    '## Manual publishing steps',
    '1. Open CapCut / 剪映',
    '2. Import voice files in scene order',
    '3. Add stock footage or generated images per shot-list.md',
    '4. Overlay subtitles from each scene.subtitle',
    '5. Export vertical 9:16 video',
    '6. Copy platform text from platform-copies.json or publish-copy.txt'
  ];

  fs.mkdirSync(input.exportDir, { recursive: true });
  fs.writeFileSync(path.join(input.exportDir, 'delivery-checklist.md'), lines.join('\n'), 'utf-8');
}
