import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

export interface AppConfig {
  llmApiKey?: string;
  llmBaseUrl: string;
  llmModel: string;
  llmWireApi: 'responses';
  hfApiKey?: string;
  outputDir: string;
  dryRun: boolean;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function resolveOutputDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.OUTPUT_DIR?.trim();
  if (configured) {
    return configured;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return path.join('output', stamp);
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    llmApiKey: env.LLM_API_KEY || env.OPENAI_API_KEY,
    llmBaseUrl: env.LLM_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    llmModel: env.LLM_MODEL || env.OPENAI_MODEL || 'gpt-5.4',
    llmWireApi: 'responses',
    hfApiKey: env.HF_API_KEY,
    outputDir: resolveOutputDir(env),
    dryRun: parseBoolean(env.DRY_RUN, false),
    requestTimeoutMs: parseInteger(env.REQUEST_TIMEOUT_MS, 45000),
    maxRetries: parseInteger(env.MAX_RETRIES, 3),
    retryBaseDelayMs: parseInteger(env.RETRY_BASE_DELAY_MS, 1500)
  };
}

export function ensureRequiredEnv(keys: string[], env: NodeJS.ProcessEnv = process.env): void {
  const missing = keys.filter((key) => !env[key] || !String(env[key]).trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function ensureDir(dirPath: string): string {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}
