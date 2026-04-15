export type SupportedPlatform = 'douyin' | 'xiaohongshu' | 'tiktok';

export type ScenePurpose = 'hook' | 'setup' | 'conflict' | 'twist' | 'payoff' | 'cta';

export type SubtitleFormat = 'srt' | 'ass';

export interface TopicIdea {
  id: string;
  niche: string;
  topic: string;
  angle: string;
  audience: string;
  monetizationScore: number;
  viralityScore: number;
  difficultyScore: number;
  recommendedOffers?: string[];
  recommendedOffer?: string[];
  tags?: string[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  voice: string;
  visualStyle: string;
  personality?: string[];
}

export interface SceneDialogue {
  characterId: string;
  text: string;
  emotion?: string;
}

export interface StoryScene {
  sceneId: string;
  order: number;
  durationSec: number;
  purpose: ScenePurpose;
  narration?: string;
  dialogue?: SceneDialogue[];
  subtitle?: string;
  subtitleText?: string;
  visualPrompt: string;
  camera?: string;
  location?: string;
  mood?: string;
  characterIds?: string[];
  transition?: string;
  imageAsset?: string;
  audioAsset?: string;
}

export interface PublishMeta {
  title?: string;
  titleOptions?: string[];
  caption: string;
  hashtags: string[];
  coverText?: string;
  platformNotes?: string[];
}

export interface MetricsTarget {
  targetPlatform?: SupportedPlatform;
  targetDurationSec?: number;
  targetAudienceRetention?: number;
  targetEngagementRate?: number;
  targetWatchRate?: number;
  targetCompletionRate?: number;
  targetClickThroughRate?: number;
  monetizationGoal?: string;
}

export interface StoryPackage {
  id: string;
  createdAt: string;
  platform: SupportedPlatform;
  niche: string;
  topic: string;
  genre: string;
  language: string;
  title: string;
  hook: string;
  summary: string;
  cta: string;
  characters: CharacterProfile[];
  scenes: StoryScene[];
  publish: PublishMeta;
  metricsTarget: MetricsTarget;
}

export interface AssetImageItem {
  sceneId: string;
  path: string;
  prompt?: string;
}

export interface AssetAudioItem {
  sceneId: string;
  path: string;
  voice?: string;
  durationSec?: number;
}

export interface AssetManifest {
  storyPackageId: string;
  generatedAt: string;
  images: AssetImageItem[];
  audio: AssetAudioItem[];
  subtitles?: {
    path: string;
    format: SubtitleFormat;
  };
}

export interface RenderTrack {
  sceneId: string;
  imagePath: string;
  audioPath: string;
  subtitleText: string;
  startSec: number;
  endSec: number;
}

export interface RenderPackage {
  storyId: string;
  aspectRatio: '9:16';
  resolution: '1080x1920';
  totalDurationSec: number;
  sceneTracks: RenderTrack[];
  srtPath: string;
  finalVideoPath?: string;
  coverPath?: string;
}

export interface RenderManifest {
  storyPackageId: string;
  generatedAt: string;
  finalVideoPath: string;
  coverImagePath?: string;
  subtitlesPath?: string;
  durationSec?: number;
}

export interface QualityReport {
  storyId: string;
  overallScore: number;
  hookScore: number;
  pacingScore: number;
  emotionalScore: number;
  clarityScore: number;
  monetizationFitScore: number;
  platformFitScore: number;
  issues: string[];
  suggestions: string[];
  recommendedPromptAdjustments?: string[];
}

export interface StoryGenerationOptions {
  topic: string;
  niche?: string;
  platform?: SupportedPlatform;
  style?: string;
  language?: string;
  targetDurationSec?: number;
  sceneCount?: number;
  template?: string;
}

export interface StoryPackageArtifacts {
  runDir: string;
  storyPackagePath: string;
  publishMetaPath: string;
  shotListPath: string;
  publishCopyPath?: string;
  deliveryChecklistPath?: string;
  assetManifestPath?: string;
  renderManifestPath?: string;
}
