import fetch, { type RequestInit } from 'node-fetch';

export interface StoryLLMRequest {
  niche: string;
  topic: string;
  durationSeconds: number;
  platform: string;
}

export interface StoryLLMScene {
  scene: number;
  narration: string;
  visualPrompt: string;
  subtitle: string;
  durationSeconds: number;
}

export interface StoryLLMResponse {
  title: string;
  hook: string;
  summary: string;
  scenes: StoryLLMScene[];
}

type EnvSource = NodeJS.ProcessEnv;
type FetchFn = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<any>; text(): Promise<string> }>;

export type OpenAIWireApi = 'responses';

export function resolveWireApi(env: NodeJS.ProcessEnv = process.env): OpenAIWireApi {
  const raw = (env.LLM_WIRE_API || env.OPENAI_WIRE_API || env.wire_api || 'responses').trim().toLowerCase();
  if (raw === 'responses') {
    return 'responses';
  }

  throw new Error(`Unsupported wire_api "${raw}". Only "responses" is supported.`);
}

export function normalizeOpenAIBaseURL(baseURL: string, wireApi: OpenAIWireApi): string {
  const trimmed = baseURL.trim();
  if (!trimmed) {
    return 'https://api.openai.com/v1';
  }

  if (wireApi !== 'responses') {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const normalizedPath = url.pathname.replace(/\/+$/, '');

    if (!normalizedPath || normalizedPath === '') {
      url.pathname = '/v1';
      return url.toString().replace(/\/$/, '');
    }

    if (!normalizedPath.endsWith('/v1')) {
      url.pathname = `${normalizedPath}/v1`;
    } else {
      url.pathname = normalizedPath;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    const normalized = trimmed.replace(/\/+$/, '');
    return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
  }
}

export function buildResponsesEndpoint(baseURL: string): string {
  return `${baseURL.replace(/\/+$/, '')}/responses`;
}

function extractTextFromResponse(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  const output = Array.isArray(response?.output) ? response.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

export class StoryLLMService {
  private apiKey?: string;
  private baseURL: string;
  private model: string;
  private wireApi: OpenAIWireApi;
  private fetchImpl: FetchFn;

  constructor(options?: { env?: EnvSource; fetchImpl?: FetchFn }) {
    const env = options?.env || process.env;
    this.apiKey = env.LLM_API_KEY || env.OPENAI_API_KEY;
    this.wireApi = resolveWireApi(env);
    const rawBaseURL = env.LLM_BASE_URL || env.OPENAI_BASE_URL || env.base_url || 'https://api.openai.com/v1';
    const baseURL = normalizeOpenAIBaseURL(rawBaseURL, this.wireApi);
    this.baseURL = baseURL;
    this.model = env.LLM_MODEL || env.OPENAI_MODEL || 'gpt-4.1-mini';
    this.fetchImpl = options?.fetchImpl || fetch;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generateStory(request: StoryLLMRequest): Promise<StoryLLMResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    const prompt = `你是爆款短视频编剧。请围绕给定主题，产出适合${request.platform}平台的中文短视频故事包。\n\n要求：\n1. 强钩子开头，前3秒抓人\n2. 节奏快，冲突明确，结尾要有反转或强情绪\n3. 总时长约${request.durationSeconds}秒\n4. 输出5-7个分镜场景\n5. 每个场景都要有： narration（口播文案）, subtitle（字幕短句）, visualPrompt（画面提示词）, durationSeconds（秒数）\n6. 只输出JSON，不要解释，不要markdown代码块\n\n题材类型：${request.niche}\n主题：${request.topic}\n\nJSON格式：\n{\n  "title": "标题",\n  "hook": "开头钩子",\n  "summary": "一句话总结",\n  "scenes": [\n    {\n      "scene": 1,\n      "narration": "",\n      "subtitle": "",\n      "visualPrompt": "",\n      "durationSeconds": 10\n    }\n  ]\n}`;

    if (this.wireApi !== 'responses') {
      throw new Error(`Unsupported wire_api "${this.wireApi}".`);
    }

    const endpoint = buildResponsesEndpoint(this.baseURL);
    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM responses API error (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const text = extractTextFromResponse(payload);
    if (!text) {
      throw new Error('LLM returned empty response text');
    }

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned) as StoryLLMResponse;
    return parsed;
  }
}
