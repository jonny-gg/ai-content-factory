import { loadOptionalTemplate, loadRuntimeConfig, type RuntimeConfig, type LoadRuntimeConfigOptions } from './load-runtime-config';

export interface StoryCliOptions extends LoadRuntimeConfigOptions {
  config?: string;
  template?: string;
  topic?: string;
  style?: string;
  dryRun?: boolean;
}

export interface ResolvedStoryRun {
  config: RuntimeConfig;
  template: string;
  topic?: string;
  style?: string;
  dryRun: boolean;
}

export function resolveStoryRun(options: StoryCliOptions = {}): ResolvedStoryRun {
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

export async function runStoryGenerationCli(options: StoryCliOptions = {}): Promise<void> {
  const resolved = resolveStoryRun(options);

  if (resolved.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'story',
      config: resolved.config,
      hasTemplate: resolved.template.length > 0,
      topic: resolved.topic ?? null,
      style: resolved.style ?? null
    }, null, 2));
    return;
  }

  console.log('Story generation pipeline is ready.');
}
