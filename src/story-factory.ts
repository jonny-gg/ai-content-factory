import { loadOptionalTemplate, loadRuntimeConfig, type RuntimeConfig } from './load-runtime-config';

export interface StoryCliOptions {
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
}

export function resolveStoryRun(options: StoryCliOptions = {}): ResolvedStoryRun {
  const config = loadRuntimeConfig(options.config);
  const template = loadOptionalTemplate(options.template) || (typeof config.template === 'string' ? config.template : '');

  return {
    config,
    template,
    topic: options.topic,
    style: options.style,
  };
}

export async function runStoryGenerationCli(options: StoryCliOptions = {}): Promise<void> {
  const resolved = resolveStoryRun(options);

  if (options.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'story',
      config: resolved.config,
      hasTemplate: resolved.template.length > 0,
      topic: resolved.topic ?? null,
      style: resolved.style ?? null,
    }, null, 2));
    return;
  }

  console.log('Story generation pipeline is ready.');
  console.log(JSON.stringify({
    mode: 'story',
    hasTemplate: resolved.template.length > 0,
    topic: resolved.topic ?? null,
    style: resolved.style ?? null,
  }, null, 2));
}
