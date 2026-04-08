import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadRuntimeConfig, loadOptionalTemplate } from '../src/load-runtime-config';

function run(): void {
  const dir = mkdtempSync(join(tmpdir(), 'runtime-config-test-'));

  try {
    const configPath = join(dir, 'config.json');
    const templatePath = join(dir, 'template.txt');

    writeFileSync(configPath, JSON.stringify({
      llmApiKey: 'file-key',
      llmBaseUrl: 'https://example.com/v1',
      llmModel: 'file-model',
      outputDir: './out',
      dryRun: true,
      requestTimeoutMs: 1234,
      maxRetries: 5,
      retryBaseDelayMs: 200,
      telegramBotToken: 'bot-token',
      telegramChatId: 'chat-id',
      template: 'inline template'
    }, null, 2));
    writeFileSync(templatePath, 'hello template');

    const config = loadRuntimeConfig({
      configPath,
      env: {
        OPENAI_API_KEY: 'fallback-openai-key'
      } as NodeJS.ProcessEnv
    });

    assert.equal(config.llmApiKey, 'file-key');
    assert.equal(config.llmBaseUrl, 'https://example.com/v1');
    assert.equal(config.llmModel, 'file-model');
    assert.equal(config.outputDir, './out');
    assert.equal(config.dryRun, true);
    assert.equal(config.requestTimeoutMs, 1234);
    assert.equal(config.maxRetries, 5);
    assert.equal(config.retryBaseDelayMs, 200);
    assert.equal(config.telegramBotToken, 'bot-token');
    assert.equal(config.telegramChatId, 'chat-id');
    assert.equal(config.template, 'inline template');

    assert.equal(loadOptionalTemplate(templatePath), 'hello template');
    assert.equal(loadOptionalTemplate(join(dir, 'missing.txt')), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

run();
console.log('load-runtime-config tests passed');
