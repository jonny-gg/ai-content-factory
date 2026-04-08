import { existsSync, readFileSync } from 'fs';
import { loadAppConfig, ensureRequiredEnv, type AppConfig } from './env-config';

export interface RuntimeConfig extends AppConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  template?: string;
}

export interface LoadRuntimeConfigOptions {
  configPath?: string;
  allowMissingLlmApiKey?: boolean;
  env?: NodeJS.ProcessEnv;
}

interface NormalizedLoadRuntimeConfigOptions {
  configPath?: string;
  allowMissingLlmApiKey: boolean;
  env: NodeJS.ProcessEnv;
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

function buildEnvFromFileConfig(env: NodeJS.ProcessEnv, fileConfig: Partial<RuntimeConfig>): NodeJS.ProcessEnv {
  return {
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
  };
}

function isLoadRuntimeConfigOptions(value: unknown): value is LoadRuntimeConfigOptions {
  return Boolean(value)
    && typeof value === 'object'
    && !('PATH' in (value as Record<string, unknown>))
    && (
      'configPath' in (value as Record<string, unknown>)
      || 'allowMissingLlmApiKey' in (value as Record<string, unknown>)
      || 'env' in (value as Record<string, unknown>)
    );
}

function normalizeOptions(configPathOrEnvOrOptions?: string | NodeJS.ProcessEnv | LoadRuntimeConfigOptions): NormalizedLoadRuntimeConfigOptions {
  if (typeof configPathOrEnvOrOptions === 'string' || typeof configPathOrEnvOrOptions === 'undefined') {
    return {
      configPath: configPathOrEnvOrOptions,
      allowMissingLlmApiKey: false,
      env: process.env,
    };
  }

  if (isLoadRuntimeConfigOptions(configPathOrEnvOrOptions)) {
    return {
      configPath: configPathOrEnvOrOptions.configPath,
      allowMissingLlmApiKey: configPathOrEnvOrOptions.allowMissingLlmApiKey ?? false,
      env: configPathOrEnvOrOptions.env ?? process.env,
    };
  }

  return {
    configPath: undefined,
    allowMissingLlmApiKey: false,
    env: configPathOrEnvOrOptions,
  };
}

export function loadRuntimeConfig(configPathOrEnvOrOptions?: string | NodeJS.ProcessEnv | LoadRuntimeConfigOptions): RuntimeConfig {
  const options = normalizeOptions(configPathOrEnvOrOptions);
  const fileConfig = readJsonConfig(options.configPath);
  const mergedEnv = buildEnvFromFileConfig(options.env, fileConfig);
  const config = loadAppConfig(mergedEnv);

  if (!options.allowMissingLlmApiKey) {
    ensureRequiredEnv(['LLM_API_KEY'], {
      ...mergedEnv,
      LLM_API_KEY: mergedEnv.LLM_API_KEY || mergedEnv.OPENAI_API_KEY
    });
  }

  return {
    ...config,
    telegramBotToken: fileConfig.telegramBotToken || options.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: fileConfig.telegramChatId || options.env.TELEGRAM_CHAT_ID,
    template: fileConfig.template
  };
}
