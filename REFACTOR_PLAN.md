# AI Content Factory - Refactor Plan

## Goal

Build a stable, incremental content production pipeline that can evolve from:

`topic -> story-package -> assets -> subtitles -> render -> publish bundle`

The refactor must preserve the current runnable story generation flow while creating clear contracts for asset generation and rendering.

---

## Core Refactor Principles

1. **Do not break the current runnable path**
   - Preserve the current story generation chain:
     - `story-cli.ts`
     - `short-drama-cli.ts`
     - `src/story-factory.ts`
     - `src/short-drama-factory.ts`
     - `src/pipelines/generate-story-package.ts`
     - `src/engines/story/story-engine.ts`

2. **Lock contracts before moving modules**
   - Stabilize core schemas before adding more layers.
   - Primary contracts:
     - `StoryPackage`
     - `StoryScene`
     - `CharacterProfile`
     - `PublishMeta`
     - `RunContext`
     - `StoryPackageArtifacts`
     - `AssetManifest`
     - `RenderManifest`

3. **Organize around the production pipeline, not aesthetics**
   - Directory structure should directly support the content production flow.

4. **Each phase must produce a usable output**
   - Every week should reduce manual work or improve end-to-end output stability.

---

## Current Status Assessment

- Topic Engine: **L1** Prototype
- Story Engine: **L2-L3** Pipeline-ready
- Asset Engine: **L1** Prototype
- Render Engine: **L0-L1** Early prototype
- Feedback Engine: **L0** Deferred

---

## Target Architecture

```text
src/
├─ core/
│  ├─ types.ts
│  ├─ run-context.ts
│  ├─ logger.ts
│  ├─ errors.ts
│  ├─ config.ts
│  └─ paths.ts
│
├─ engines/
│  ├─ story/
│  │  ├─ story-engine.ts
│  │  ├─ story-llm.ts
│  │  ├─ prompt-builder.ts
│  │  ├─ structure-validator.ts
│  │  └─ scene-expander.ts
│  │
│  ├─ visual/
│  │  ├─ image-engine.ts
│  │  ├─ visual-prompt-builder.ts
│  │  └─ shot-assets.ts
│  │
│  ├─ audio/
│  │  ├─ tts-engine.ts
│  │  ├─ voice-casting.ts
│  │  └─ audio-timing.ts
│  │
│  ├─ render/
│  │  ├─ subtitle-builder.ts
│  │  ├─ timeline-builder.ts
│  │  ├─ video-composer.ts
│  │  └─ ffmpeg-runner.ts
│  │
│  └─ topic/
│     ├─ topic-engine.ts
│     ├─ topic-scorer.ts
│     └─ topic-diversifier.ts
│
├─ pipelines/
│  ├─ generate-story-package.ts
│  ├─ generate-assets.ts
│  ├─ render-video.ts
│  ├─ full-auto-pipeline.ts
│  └─ batch-pipeline.ts
│
├─ cli/
│  ├─ story-cli.ts
│  ├─ render-cli.ts
│  └─ batch-cli.ts
│
├─ storage/
│  ├─ run-store.ts
│  ├─ asset-store.ts
│  └─ history-store.ts
│
└─ index.ts
```

This is the **target state**, not an all-at-once migration plan.

---

## Canonical Data Contracts

### TopicIdea

```ts
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
  tags?: string[];
}
```

### CharacterProfile

```ts
export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  voice: string;
  visualStyle: string;
  personality?: string[];
}
```

### ScenePurpose

```ts
export type ScenePurpose =
  | 'hook'
  | 'setup'
  | 'conflict'
  | 'twist'
  | 'payoff'
  | 'cta';
```

### StoryScene

```ts
export interface StoryScene {
  sceneId: string;
  order: number;
  durationSec: number;
  purpose: ScenePurpose;

  narration?: string;
  dialogue?: Array<{
    characterId: string;
    text: string;
    emotion?: string;
  }>;

  visualPrompt: string;
  subtitleText?: string;

  camera?: string;
  location?: string;
  mood?: string;
  characterIds?: string[];
  transition?: string;
}
```

### PublishMeta

```ts
export interface PublishMeta {
  title: string;
  caption: string;
  hashtags: string[];
  coverText?: string;
  platformNotes?: string[];
}
```

### MetricsTarget

```ts
export interface MetricsTarget {
  targetPlatform: 'douyin' | 'xiaohongshu' | 'tiktok';
  targetDurationSec: number;
  targetAudienceRetention?: number;
  targetCompletionRate?: number;
  targetEngagementRate?: number;
}
```

### StoryPackage

```ts
export interface StoryPackage {
  id: string;
  createdAt: string;

  platform: 'douyin' | 'xiaohongshu' | 'tiktok';
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
```

### AssetManifest

```ts
export interface AssetManifest {
  storyPackageId: string;
  generatedAt: string;

  images: Array<{
    sceneId: string;
    path: string;
    prompt?: string;
  }>;

  audio: Array<{
    sceneId: string;
    path: string;
    voice?: string;
    durationSec?: number;
  }>;

  subtitles?: {
    path: string;
    format: 'srt' | 'ass';
  };
}
```

### RenderManifest

```ts
export interface RenderManifest {
  storyPackageId: string;
  generatedAt: string;
  finalVideoPath: string;
  coverImagePath?: string;
  subtitlesPath?: string;
  durationSec?: number;
}
```

---

## Required Run Directory Contract

Each run directory should converge to this structure:

```text
output/runs/<run-id>/
├─ story-package.json
├─ publish-meta.json
├─ publish-copy.txt
├─ shot-list.md
├─ delivery-checklist.md
├─ asset-manifest.json
├─ render-manifest.json
├─ images/
├─ audio/
└─ renders/
```

Rules:
- `story-package.json` is the canonical content package.
- `publish-meta.json` and `publish-copy.txt` are publishing artifacts.
- `asset-manifest.json` is the canonical asset index.
- `render-manifest.json` is the canonical render result.
- `images/`, `audio/`, and `renders/` are stable well-known paths.

---

## Canonical Pipelines

### Pipeline A - `generate-story-package`

**Input**
- topic
- style
- platform
- niche

**Output**
- `story-package.json`
- `publish-meta.json`
- `shot-list.md`
- `publish-copy.txt`
- `delivery-checklist.md`

### Pipeline B - `generate-assets`

**Input**
- `story-package.json`

**Output**
- `images/*`
- `audio/*`
- `asset-manifest.json`

### Pipeline C - `render-video`

**Input**
- `story-package.json`
- `asset-manifest.json`

**Output**
- `subtitles.srt`
- `final.mp4`
- `render-manifest.json`

### Pipeline D - `full-auto-pipeline`

**Input**
- topic/config

**Output**
- full run directory containing script, assets, subtitles, render outputs, publish artifacts, and checklist

---

## Migration Strategy

### Keep stable for now

Do not heavily restructure these yet:
- `src/core/types.ts`
- `src/core/run-context.ts`
- `src/pipelines/generate-story-package.ts`
- `src/engines/story/story-engine.ts`
- `src/story-llm.ts`
- `src/story-factory.ts`
- `src/short-drama-factory.ts`
- `story-cli.ts`
- `short-drama-cli.ts`

### First migration targets

1. `src/story-llm.ts`
   - Move toward `src/engines/story/story-llm.ts`
   - Keep old file as re-export shim during migration

2. `src/image-service.ts`
   - Move toward `src/engines/visual/image-engine.ts`
   - Later split prompt-building from generation

3. `src/tts-service.ts`
   - Move toward `src/engines/audio/tts-engine.ts`

4. CLI logic
   - Move toward `src/cli/*`
   - Keep root CLI files as thin wrappers

---

## Four-Week Execution Plan

### Week 1 - Lock schema and run contract

**Goal**
Create stable, machine-consumable outputs.

**Tasks**
- Finalize `StoryPackage` schema
- Add `AssetManifest` and `RenderManifest`
- Standardize run directory contract
- Preserve old CLI behavior

**Deliverable**
- Stable schemas
- Stable output layout
- No regression in story generation

### Week 2 - Build asset pipeline

**Goal**
Convert `story-package.json` into images and audio.

**Tasks**
- Add `src/pipelines/generate-assets.ts`
- Standardize scene -> image prompt generation
- Standardize scene -> narration/dialogue -> audio generation
- Output `asset-manifest.json`

**Deliverable**
- Each scene can produce:
  - one image
  - one audio file

### Week 3 - Build render pipeline

**Goal**
Convert assets into a real video output.

**Tasks**
- Add `subtitle-builder.ts`
- Add `timeline-builder.ts`
- Add `ffmpeg-runner.ts`
- Add `render-video.ts`

**Deliverable**
- `subtitles.srt`
- `final.mp4`

### Week 4 - Full automation and batching

**Goal**
One command to complete the full pipeline.

**Tasks**
- Add `full-auto-pipeline.ts`
- Connect CLIs to end-to-end flow
- Add retry handling and logs
- Add initial `batch-pipeline.ts`

**Deliverable**
- One-command end-to-end run
- Minimal batch generation support

---

## Explicitly Deferred

### Feedback system
Deferred until the render pipeline is stable:
- `quality-judge.ts`
- `prompt-optimizer.ts`
- `score-history.ts`

### Over-splitting config
Deferred until defaults prove insufficient:
- `platforms/*.json`
- `voices/*.json`
- separate judge/visual system prompt files

### Heavy storage abstraction
Deferred until multiple pipelines need durable shared indexing:
- `prompt-store.ts`
- `history-store.ts`
- publish registry layers

---

## Acceptance Criteria

### Phase 1 complete when
- `story-package.json` schema is stable
- run directory shape is stable
- publish artifacts are stable

### Phase 2 complete when
- all scenes can generate indexed image/audio artifacts
- `asset-manifest.json` is written successfully

### Phase 3 complete when
- subtitle file generation is deterministic
- video output is produced from manifests
- `render-manifest.json` is written successfully

### Phase 4 complete when
- one command runs story -> assets -> render
- failures are visible and recoverable
- batch mode can queue multiple topics

---

## Immediate Next Coding Moves

1. Update `src/core/types.ts`
   - align naming and fields with the canonical contracts
   - keep compatibility where possible

2. Update `src/core/run-context.ts`
   - include helpers for asset/render manifest paths if needed

3. Add `src/pipelines/generate-assets.ts`
   - use existing `image-service.ts` and `tts-service.ts`
   - write `asset-manifest.json`

4. Only after that, start render pipeline work

---

## Practical Rule

Do **not** do a large directory reshuffle first.

Do this instead:
- stabilize schema
- stabilize output layout
- build asset pipeline
- build render pipeline
- migrate files gradually with compatibility shims

That is the shortest path to a real content factory.