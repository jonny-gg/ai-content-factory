import { formatFullPipelineResult, runFullPipeline, type FullPipelineOptions } from './full-pipeline';

export interface FullPipelineCliOptions extends FullPipelineOptions {}

export async function runFullPipelineCli(options: FullPipelineCliOptions = {}): Promise<void> {
  const result = await runFullPipeline(options);
  console.log(formatFullPipelineResult(result));
}
