import { loadOptionalTemplate, loadRuntimeConfig, type RuntimeConfig, type LoadRuntimeConfigOptions } from './load-runtime-config';

export interface ShortDramaCliOptions extends LoadRuntimeConfigOptions {
  config?: string;
  template?: string;
  topic?: string;
  style?: string;
  dryRun?: boolean;
}

export interface ResolvedShortDramaRun {
  config: RuntimeConfig;
  template: string;
  topic?: string;
  style?: string;
  dryRun: boolean;
}

export function resolveShortDramaRun(options: ShortDramaCliOptions = {}): ResolvedShortDramaRun {
  const config = loadRuntimeConfig({
    configPath: options.config ?? options.configPath,
    allowMissingLlmApiKey: options.allowMissingLlmApiKey,
    env: options.env
  });
  const template = loadOptionalTemplate(options.template) || (typeof config.template === 'string' ? config.template : '');

  return {
    config,
    template,
    topic: options.topic,
    style: options.style,
    dryRun: typeof options.dryRun === 'boolean' ? options.dryRun : config.dryRun
  };
}

export async function runShortDramaGenerationCli(options: ShortDramaCliOptions = {}): Promise<void> {
  const resolved = resolveShortDramaRun(options);

  if (resolved.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'short-drama',
      config: resolved.config,
      hasTemplate: resolved.template.length > 0,
      topic: resolved.topic ?? null,
      style: resolved.style ?? null
    }, null, 2));
    return;
  }

  console.log('Short drama generation pipeline is ready.');
}
