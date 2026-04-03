import fetch, { type RequestInit } from 'node-fetch';
import { z } from 'zod';

export interface StoryLLMScene {
  scene: number;
  visual: string;
  narration: string;
  durationSec?: number;
}

export interface StoryLLMRequest {
  topic: string;
  niche?: string;
  angle?: string;
  platform?: string;
  durationSec?: number;
  durationSeconds?: number;
  audience?: string;
  monetizationGoal?: string;
}

export interface StoryLLMResponse {
  title: string;
  hook: string;
  summary: string;
  scenes: StoryLLMScene[];
}

type EnvSource = NodeJS.ProcessEnv;
type FetchFn = (url: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}>;

export type OpenAIWireApi = 'responses';

const StorySceneSchema = z.object({
  scene: z.number().int().positive(),
  visual: z.string().min(1),
  narration: z.string().min(1),
  durationSec: z.number().positive().optional()
});

const StoryResponseSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  summary: z.string().min(1),
  scenes: z.array(StorySceneSchema).default([])
});

export function resolveWireApi(env: NodeJS.ProcessEnv = process.env): OpenAIWireApi {
  const raw = (env.LLM_WIRE_API || env.OPENAI_WIRE_API || 'responses').trim();
  if (raw === 'responses') {
    return 'responses';
  }

  throw new Error(`Unsupported wire_api "${raw}". Only "responses" is supported.`);
}

export function normalizeOpenAIBaseURL(baseURL: string, wireApi: OpenAIWireApi): string {
  const trimmed = baseURL.trim().replace(/\/+$/, '');
  if (wireApi === 'responses') {
    return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
  }

  return trimmed;
}

export function buildResponsesEndpoint(baseURL: string): string {
  return `${baseURL.replace(/\/+$/, '')}/responses`;
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks: string[] = [];
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }

  return chunks.join('\n').trim();
}

function parseStoryJson(text: string): StoryLLMResponse {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fencedMatch ? fencedMatch[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Story LLM response did not contain valid JSON object text.');
  }

  const parsed = JSON.parse(raw.slice(start, end + 1));
  return StoryResponseSchema.parse(parsed);
}

function buildPrompt(request: StoryLLMRequest): string {
  const resolvedDuration = request.durationSec || request.durationSeconds || 30;

  return [
    '请输出一个适合短视频带货/内容分发的故事脚本，返回 JSON。',
    `topic: ${request.topic}`,
    `niche: ${request.niche || '通用消费'}`,
    `angle: ${request.angle || '高转化、强钩子、强情绪'}`,
    `platform: ${request.platform || 'douyin'}`,
    `durationSec: ${resolvedDuration}`,
    `audience: ${request.audience || '泛消费人群'}`,
    `monetizationGoal: ${request.monetizationGoal || '提升点击和转化'}`,
    'JSON schema: {"title":"","hook":"","summary":"","scenes":[{"scene":1,"visual":"","narration":"","durationSec":5}]}'
  ].join('\n');
}

export class StoryLLMService {
  private readonly env: EnvSource;
  private readonly fetchImpl: FetchFn;

  constructor(options?: { env?: EnvSource; fetchImpl?: FetchFn }) {
    this.env = options?.env || process.env;
    this.fetchImpl = options?.fetchImpl || (fetch as unknown as FetchFn);
  }

  async generateStory(request: StoryLLMRequest): Promise<StoryLLMResponse> {
    const apiKey = this.env.LLM_API_KEY || this.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY (or LLM_API_KEY) for StoryLLMService.');
    }

    const wireApi = resolveWireApi(this.env);
    const normalizedBaseUrl = normalizeOpenAIBaseURL(
      this.env.LLM_BASE_URL || this.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      wireApi
    );
    const endpoint = buildResponsesEndpoint(normalizedBaseUrl);
    const model = this.env.LLM_MODEL || this.env.OPENAI_MODEL || 'gpt-5.4';

    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: buildPrompt(request)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Story LLM request failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new Error('Story LLM response did not contain output_text.');
    }

    return parseStoryJson(outputText);
  }
}
