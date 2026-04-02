import { resolveOptionalJson, resolveOptionalText } from './cli-utils';

export interface RuntimeConfig {
  model?: string;
  provider?: string;
  outputDir?: string;
  temperature?: number;
  maxTokens?: number;
  template?: string;
  [key: string]: unknown;
}

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  model: 'gpt-5.4',
  outputDir: 'outputs',
  temperature: 0.7,
  maxTokens: 4096,
};

export function loadRuntimeConfig(configPath?: string): RuntimeConfig {
  if (!configPath) {
    return { ...DEFAULT_RUNTIME_CONFIG };
  }

  return resolveOptionalJson<RuntimeConfig>(configPath, DEFAULT_RUNTIME_CONFIG);
}

export function loadOptionalTemplate(templatePath?: string): string {
  if (!templatePath) {
    return '';
  }

  return resolveOptionalText(templatePath, '');
}
