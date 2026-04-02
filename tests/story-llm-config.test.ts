import assert from 'node:assert/strict';
import { normalizeOpenAIBaseURL, resolveWireApi } from '../src/story-llm';

function run(): void {
  assert.equal(resolveWireApi({ LLM_WIRE_API: 'responses' }), 'responses');
  assert.equal(resolveWireApi({ OPENAI_WIRE_API: 'responses' }), 'responses');

  assert.throws(
    () => resolveWireApi({ OPENAI_WIRE_API: 'chat_completions' }),
    /Unsupported wire_api/
  );

  assert.equal(
    normalizeOpenAIBaseURL('http://codeai.apac1.edgenext.co', 'responses'),
    'http://codeai.apac1.edgenext.co/v1'
  );
  assert.equal(
    normalizeOpenAIBaseURL('http://codeai.apac1.edgenext.co/', 'responses'),
    'http://codeai.apac1.edgenext.co/v1'
  );
  assert.equal(
    normalizeOpenAIBaseURL('http://codeai.apac1.edgenext.co/v1', 'responses'),
    'http://codeai.apac1.edgenext.co/v1'
  );
}

run();
console.log('story-llm config tests passed');
