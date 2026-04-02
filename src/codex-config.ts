import * as fs from 'fs';

function extractTomlValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`^${key}\\s*=\\s*\"([^\"]+)\"`, 'm');
  const match = content.match(regex);
  return match?.[1];
}

export interface CodexOpenAIConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export function loadCodexOpenAIConfig(): CodexOpenAIConfig {
  const result: CodexOpenAIConfig = {};

  try {
    const toml = fs.readFileSync('/root/.codex/config.toml', 'utf-8');
    result.model = extractTomlValue(toml, 'model');
    result.baseUrl = extractTomlValue(toml, 'base_url');
  } catch {
    // ignore
  }

  try {
    const auth = JSON.parse(fs.readFileSync('/root/.codex/auth.json', 'utf-8')) as Record<string, string>;
    result.apiKey = auth.OPENAI_API_KEY;
  } catch {
    // ignore
  }

  return result;
}
