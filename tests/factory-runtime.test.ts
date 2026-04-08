import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolveStoryRun } from '../src/story-factory';
import { resolveShortDramaRun } from '../src/short-drama-factory';

function run(): void {
  const dir = mkdtempSync(join(tmpdir(), 'factory-runtime-test-'));

  try {
    const configPath = join(dir, 'config.json');
    const templatePath = join(dir, 'template.md');

    writeFileSync(configPath, JSON.stringify({
      llmApiKey: 'file-key',
      llmBaseUrl: 'https://example.com/v1',
      llmModel: 'factory-model',
      template: 'config template',
      dryRun: false
    }, null, 2));
    writeFileSync(templatePath, 'template from file');

    const env = {
      OPENAI_API_KEY: 'fallback-openai-key'
    } as NodeJS.ProcessEnv;

    const story = resolveStoryRun({
      config: configPath,
      template: templatePath,
      topic: 'story-topic',
      style: 'story-style',
      dryRun: true,
      env
    });

    assert.equal(story.config.llmModel, 'factory-model');
    assert.equal(story.template, 'template from file');
    assert.equal(story.topic, 'story-topic');
    assert.equal(story.style, 'story-style');
    assert.equal(story.dryRun, true);

    const shortDrama = resolveShortDramaRun({
      config: configPath,
      template: undefined,
      topic: 'drama-topic',
      style: 'drama-style',
      dryRun: true,
      env
    });

    assert.equal(shortDrama.config.llmModel, 'factory-model');
    assert.equal(shortDrama.template, 'config template');
    assert.equal(shortDrama.topic, 'drama-topic');
    assert.equal(shortDrama.style, 'drama-style');
    assert.equal(shortDrama.dryRun, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

run();
console.log('factory runtime tests passed');
