import fs from 'node:fs';
import path from 'node:path';
import { runChapterFullPipeline, type ChapterFullPipelineOptions } from './chapter-full-pipeline';

interface ChapterIndexItem {
  chapterNumber: number;
  chapterId: string;
  title: string;
  file: string;
  stage: string;
}

interface ChapterIndexFile {
  baseDir?: string;
  chapters: ChapterIndexItem[];
}

export interface ChapterBatchOptions extends Omit<ChapterFullPipelineOptions, 'chapterPackPath'> {
  indexPath: string;
  chapterNumbers?: number[];
  stage?: string;
}

export interface ChapterBatchRunResult {
  chapterNumber: number;
  chapterId: string;
  title: string;
  ok: boolean;
  runDir?: string;
  error?: string;
}

export interface ChapterBatchResult {
  indexPath: string;
  selectedCount: number;
  succeeded: number;
  failed: number;
  runs: ChapterBatchRunResult[];
}

function readIndex(indexPath: string): ChapterIndexFile {
  return JSON.parse(fs.readFileSync(path.resolve(indexPath), 'utf8')) as ChapterIndexFile;
}

function resolveChapterPackPath(indexPath: string, file: string): string {
  const absoluteFile = path.resolve(file);
  if (fs.existsSync(absoluteFile)) {
    return absoluteFile;
  }

  const indexDir = path.dirname(path.resolve(indexPath));
  return path.resolve(indexDir, file);
}

function shouldIncludeChapter(item: ChapterIndexItem, options: ChapterBatchOptions): boolean {
  if (options.chapterNumbers && options.chapterNumbers.length > 0) {
    return options.chapterNumbers.includes(item.chapterNumber);
  }
  if (options.stage) {
    return item.stage === options.stage;
  }
  return true;
}

export async function runChapterBatch(options: ChapterBatchOptions): Promise<ChapterBatchResult> {
  const index = readIndex(options.indexPath);
  const selected = index.chapters.filter((item) => shouldIncludeChapter(item, options));
  const runs: ChapterBatchRunResult[] = [];

  for (const item of selected) {
    try {
      const result = await runChapterFullPipeline({
        ...options,
        chapterPackPath: resolveChapterPackPath(options.indexPath, item.file),
      });
      runs.push({
        chapterNumber: item.chapterNumber,
        chapterId: item.chapterId,
        title: item.title,
        ok: true,
        runDir: result.runDir,
      });
    } catch (error) {
      runs.push({
        chapterNumber: item.chapterNumber,
        chapterId: item.chapterId,
        title: item.title,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    indexPath: path.resolve(options.indexPath),
    selectedCount: selected.length,
    succeeded: runs.filter((item) => item.ok).length,
    failed: runs.filter((item) => !item.ok).length,
    runs,
  };
}

export function formatChapterBatchResult(result: ChapterBatchResult): string {
  return JSON.stringify({
    ok: result.failed === 0,
    mode: 'chapter-batch',
    indexPath: result.indexPath,
    selectedCount: result.selectedCount,
    succeeded: result.succeeded,
    failed: result.failed,
    runs: result.runs,
  }, null, 2);
}
