import assert from 'node:assert/strict';
import { createStoryLlmClient } from '../src/story-llm';

const client = createStoryLlmClient({
  llmApiKey: 'test-key'
});

assert.equal(client.config.model, 'gpt-5.4');
console.log('story-llm default model test passed');
