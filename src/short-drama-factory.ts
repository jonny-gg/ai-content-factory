import {
  resolveStoryRun,
  runStoryGenerationCli,
  type ResolvedStoryRun,
  type StoryCliOptions
} from './story-factory';

export type ShortDramaCliOptions = StoryCliOptions;
export type ResolvedShortDramaRun = ResolvedStoryRun;

export function resolveShortDramaRun(options: ShortDramaCliOptions = {}): ResolvedShortDramaRun {
  return resolveStoryRun(options);
}

export async function runShortDramaCli(options: ShortDramaCliOptions = {}): Promise<void> {
  await runStoryGenerationCli(options);
}

export async function runShortDramaGenerationCli(options: ShortDramaCliOptions = {}): Promise<void> {
  await runShortDramaCli(options);
}
