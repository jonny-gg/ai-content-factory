import { formatChapterFullPipelineResult, runChapterFullPipeline, type ChapterFullPipelineOptions } from './chapter-full-pipeline';

export interface ChapterFullPipelineCliOptions extends ChapterFullPipelineOptions {}

export async function runChapterFullPipelineCli(options: ChapterFullPipelineCliOptions): Promise<void> {
  const result = await runChapterFullPipeline(options);
  console.log(formatChapterFullPipelineResult(result));
}
