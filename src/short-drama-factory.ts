import { loadOptionalTemplate, loadRuntimeConfig, type RuntimeConfig } from './load-runtime-config';

export interface ShortDramaCliOptions {
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
}

export function resolveShortDramaRun(options: ShortDramaCliOptions = {}): ResolvedShortDramaRun {
  const config = loadRuntimeConfig(options.config);
  const template = loadOptionalTemplate(options.template) || (typeof config.template === 'string' ? config.template : '');

  return {
    config,
    template,
    topic: options.topic,
    style: options.style,
  };
}

export async function runShortDramaGenerationCli(options: ShortDramaCliOptions = {}): Promise<void> {
  const resolved = resolveShortDramaRun(options);

  if (options.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'short-drama',
      config: resolved.config,
      hasTemplate: resolved.template.length > 0,
      topic: resolved.topic ?? null,
      style: resolved.style ?? null,
    }, null, 2));
    return;
  }

  console.log('Short-drama generation pipeline is ready.');
  console.log(JSON.stringify({
    mode: 'short-drama',
    hasTemplate: resolved.template.length > 0,
    topic: resolved.topic ?? null,
    style: resolved.style ?? null,
  }, null, 2));
}
