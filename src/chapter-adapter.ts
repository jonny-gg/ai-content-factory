import fs from 'node:fs';
import path from 'node:path';
import { createRunContext, writeStoryArtifacts } from './core/run-context';
import type { StoryPackage, StoryScene, SupportedPlatform } from './core/types';

interface ChapterShotInput {
  shotId: string;
  order: number;
  durationSec: number;
  purpose: 'hook' | 'setup' | 'conflict' | 'twist' | 'payoff' | 'cta';
  scene: string;
  visual: string;
  camera?: string;
  voiceover?: string;
  subtitle?: string;
  imagePromptZh?: string;
  imagePromptEn?: string;
}

interface ChapterProductionPack {
  seriesId: string;
  seriesTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  targetPlatform?: SupportedPlatform;
  language?: string;
  targetDurationSec?: number;
  summary?: string;
  coreHook?: string;
  voiceoverScript?: string[];
  shots: ChapterShotInput[];
}

export interface BuildChapterStoryOptions {
  chapterPackPath: string;
  outputRoot?: string;
  niche?: string;
  genre?: string;
  platform?: SupportedPlatform;
}

export interface BuildChapterStoryResult {
  runDir: string;
  storyPackagePath: string;
  publishMetaPath: string;
  shotListPath: string;
  storyPackage: StoryPackage;
}

function readChapterPack(filePath: string): ChapterProductionPack {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8')) as ChapterProductionPack;
}

function makeCharacters(): StoryPackage['characters'] {
  return [
    {
      id: 'linchuan',
      name: '林川',
      role: '主角',
      voice: 'calm-male',
      visualStyle: '都市现实主义，克制冷静，职场逆袭感',
      personality: ['隐忍', '能干', '逻辑强']
    }
  ];
}

function toScene(shot: ChapterShotInput): StoryScene {
  return {
    sceneId: shot.shotId,
    order: shot.order,
    durationSec: shot.durationSec,
    purpose: shot.purpose,
    narration: shot.voiceover ?? shot.visual,
    subtitle: shot.subtitle ?? shot.voiceover ?? shot.visual,
    subtitleText: shot.subtitle ?? shot.voiceover ?? shot.visual,
    visualPrompt: shot.imagePromptZh ?? shot.visual,
    camera: shot.camera,
    location: shot.scene,
    mood: shot.purpose === 'hook' || shot.purpose === 'conflict' ? 'tense' : shot.purpose === 'payoff' ? 'release' : 'steady',
    characterIds: ['linchuan'],
    transition: shot.order === 1 ? 'cold-open' : 'cut'
  };
}

function buildStoryPackage(pack: ChapterProductionPack, options: BuildChapterStoryOptions): StoryPackage {
  const platform = options.platform ?? pack.targetPlatform ?? 'douyin';
  const genre = options.genre ?? '职场打脸爽剧';
  const niche = options.niche ?? '职场打脸/副业逆袭';
  const hook = pack.coreHook ?? pack.summary ?? pack.chapterTitle;
  const summary = pack.summary ?? pack.voiceoverScript?.join(' ') ?? pack.chapterTitle;
  const title = `${pack.chapterNumber}. ${pack.chapterTitle}`;
  const scenes = [...pack.shots]
    .sort((a, b) => a.order - b.order)
    .map(toScene);

  const hashtags = ['#职场打脸', '#副业逆袭', '#短剧', '#爽剧', '#林川'];
  const caption = `${title}｜${hook}`;

  return {
    id: `${pack.seriesId}-${pack.chapterId}`,
    createdAt: new Date().toISOString(),
    platform,
    niche,
    topic: pack.seriesTitle,
    genre,
    language: pack.language ?? 'zh-CN',
    title,
    hook,
    summary,
    cta: '关注追更，下一章更狠。',
    characters: makeCharacters(),
    scenes,
    publish: {
      title,
      titleOptions: [title, `${pack.chapterTitle}｜职场逆袭`, `${pack.chapterTitle}｜爽剧连载`],
      caption,
      hashtags,
      coverText: pack.chapterTitle,
      platformNotes: ['chapter-adapter generated']
    },
    metricsTarget: {
      targetPlatform: platform,
      targetDurationSec: pack.targetDurationSec,
      monetizationGoal: '连载涨粉 + 短剧内容验证'
    }
  };
}

export async function buildChapterStory(options: BuildChapterStoryOptions): Promise<BuildChapterStoryResult> {
  const pack = readChapterPack(options.chapterPackPath);
  const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), 'output', 'chapters');
  const topic = `${pack.seriesTitle}-${pack.chapterTitle}`;
  const runContext = createRunContext(outputRoot, topic);
  const storyPackage = buildStoryPackage(pack, options);
  const artifacts = writeStoryArtifacts(runContext, storyPackage);

  return {
    runDir: artifacts.runDir,
    storyPackagePath: artifacts.storyPackagePath,
    publishMetaPath: artifacts.publishMetaPath,
    shotListPath: artifacts.shotListPath,
    storyPackage,
  };
}

export function formatBuildChapterStoryResult(result: BuildChapterStoryResult): string {
  return JSON.stringify({
    ok: true,
    mode: 'chapter-story',
    storyId: result.storyPackage.id,
    title: result.storyPackage.title,
    runDir: result.runDir,
    storyPackagePath: result.storyPackagePath,
    publishMetaPath: result.publishMetaPath,
    shotListPath: result.shotListPath,
    scenes: result.storyPackage.scenes.length,
  }, null, 2);
}
