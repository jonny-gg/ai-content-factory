import OpenAI from 'openai';

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
  private client?: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL
      });
    }
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async generateStory(request: StoryLLMRequest): Promise<StoryLLMResponse | null> {
    if (!this.client) {
      return null;
    }

    const prompt = `你是爆款短视频编剧。请围绕给定主题，产出适合${request.platform}平台的中文短视频故事包。\n\n要求：\n1. 强钩子开头，前3秒抓人\n2. 节奏快，冲突明确，结尾要有反转或强情绪\n3. 总时长约${request.durationSeconds}秒\n4. 输出5-7个分镜场景\n5. 每个场景都要有： narration（口播文案）, subtitle（字幕短句）, visualPrompt（画面提示词）, durationSeconds（秒数）\n6. 只输出JSON，不要解释，不要markdown代码块\n\n题材类型：${request.niche}\n主题：${request.topic}\n\nJSON格式：\n{\n  "title": "标题",\n  "hook": "开头钩子",\n  "summary": "一句话总结",\n  "scenes": [\n    {\n      "scene": 1,\n      "narration": "",\n      "subtitle": "",\n      "visualPrompt": "",\n      "durationSeconds": 10\n    }\n  ]\n}`;

    const response = await this.client.responses.create({
      model: this.model,
      input: prompt
    });

    const text = extractTextFromResponse(response);
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
