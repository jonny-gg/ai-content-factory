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
      OPENAI_WIRE_API: 'responses'
    } as NodeJS.ProcessEnv,
    fetchImpl
  });

  await service.generateStory({
    niche: 'niche',
    topic: 'topic',
    durationSeconds: 30,
    platform: 'douyin'
  });

  const payload = JSON.parse((requests[0]?.init?.body || '{}') as string) as { model?: string };
  assert.equal(payload.model, 'gpt-5.4');
}

run()
  .then(() => {
    console.log('story-llm default model tests passed');
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
