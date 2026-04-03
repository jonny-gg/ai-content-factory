import { existsSync, readFileSync } from 'fs';
import { loadAppConfig, ensureRequiredEnv, type AppConfig } from './env-config';

export interface RuntimeConfig extends AppConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  template?: string;
}

function readJsonConfig(configPath?: string): Partial<RuntimeConfig> {
  if (!configPath) {
    return {};
  }

  if (!existsSync(configPath)) {
    return {};
  }

  const raw = readFileSync(configPath, 'utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as Partial<RuntimeConfig>;
}

export function loadOptionalTemplate(templatePath?: string): string {
  if (!templatePath) {
    return '';
  }

  if (!existsSync(templatePath)) {
    return '';
  }

  return readFileSync(templatePath, 'utf8');
}

export function loadRuntimeConfig(configPathOrEnv?: string | NodeJS.ProcessEnv): RuntimeConfig {
  const env = typeof configPathOrEnv === 'string' || typeof configPathOrEnv === 'undefined'
    ? process.env
    : configPathOrEnv;
  const fileConfig = typeof configPathOrEnv === 'string' ? readJsonConfig(configPathOrEnv) : {};
  const config = loadAppConfig({
    ...env,
    ...(fileConfig.llmApiKey ? { LLM_API_KEY: fileConfig.llmApiKey } : {}),
    ...(fileConfig.llmBaseUrl ? { LLM_BASE_URL: fileConfig.llmBaseUrl } : {}),
    ...(fileConfig.llmModel ? { LLM_MODEL: fileConfig.llmModel } : {}),
    ...(fileConfig.hfApiKey ? { HF_API_KEY: fileConfig.hfApiKey } : {}),
    ...(fileConfig.outputDir ? { OUTPUT_DIR: fileConfig.outputDir } : {}),
    ...(typeof fileConfig.dryRun === 'boolean' ? { DRY_RUN: String(fileConfig.dryRun) } : {}),
    ...(fileConfig.requestTimeoutMs ? { REQUEST_TIMEOUT_MS: String(fileConfig.requestTimeoutMs) } : {}),
    ...(fileConfig.maxRetries ? { MAX_RETRIES: String(fileConfig.maxRetries) } : {}),
    ...(fileConfig.retryBaseDelayMs ? { RETRY_BASE_DELAY_MS: String(fileConfig.retryBaseDelayMs) } : {})
  });

  ensureRequiredEnv(['LLM_API_KEY'], {
    ...env,
    LLM_API_KEY: fileConfig.llmApiKey || env.LLM_API_KEY || env.OPENAI_API_KEY
  });

  return {
    ...config,
    telegramBotToken: fileConfig.telegramBotToken || env.TELEGRAM_BOT_TOKEN,
    telegramChatId: fileConfig.telegramChatId || env.TELEGRAM_CHAT_ID,
    template: fileConfig.template
  };
}
