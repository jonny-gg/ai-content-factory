import assert from 'node:assert/strict';
import { Response, type RequestInit } from 'node-fetch';
import { StoryLLMService } from '../src/story-llm';

async function run(): Promise<void> {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = async (url: string, init?: RequestInit): Promise<Response> => {
    requests.push({ url, init });
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        title: 't',
        hook: 'h',
        summary: 's',
        scenes: []
      })
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const service = new StoryLLMService({
    env: {
      OPENAI_API_KEY: 'sk-test',
      OPENAI_BASE_URL: 'https://codeai.apac1.edgenext.co',
      OPENAI_MODEL: 'gpt-4.1-mini',
      OPENAI_WIRE_API: 'responses'
    } as NodeJS.ProcessEnv,
    fetchImpl
  });

  const result = await service.generateStory({
    niche: 'niche',
    topic: 'topic',
    durationSeconds: 30,
    platform: 'douyin'
  });

  assert.ok(result);
  assert.equal(result?.title, 't');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://codeai.apac1.edgenext.co/v1/responses');
  assert.equal(requests[0]?.init?.method, 'POST');

  const headers = (requests[0]?.init?.headers || {}) as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer sk-test');
  assert.equal(headers['Content-Type'], 'application/json');

  const payload = JSON.parse((requests[0]?.init?.body || '{}') as string) as { model?: string; input?: string };
  assert.equal(payload.model, 'gpt-4.1-mini');
  assert.equal(typeof payload.input, 'string');
  assert.ok(payload.input?.includes('topic'));
}

run()
  .then(() => {
    console.log('story-llm responses tests passed');
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
