# AI Content Factory Architecture

## Target shape

The project is being migrated from ad-hoc scripts into a pipeline-driven content factory with stable data contracts.

## Core layers

- `src/core/`: shared types and run context helpers
- `src/engines/`: business engines grouped by domain
- `src/pipelines/`: orchestration flows that turn inputs into deliverables
- `src/storage/`: future persistence layer for runs, prompts, and score history
- `output/runs/`: generated run artifacts

## Current implemented path

### Story package pipeline

Input:
- topic
- niche
- style
- platform
- language

Output:
- `story-package.json`
- `publish-meta.json`
- `publish-copy.txt`
- `shot-list.md`
- `DELIVERY-CHECKLIST.md`

## Canonical schema

The canonical content contract now lives in `src/core/types.ts` and includes:

- `StoryPackage`
- `StoryScene`
- `CharacterProfile`
- `RenderPackage`
- `QualityReport`
- `TopicIdea`

## Next layers to plug in

1. Scene-aware image generation
2. Scene-aware TTS generation
3. Render timeline + ffmpeg composition
4. Quality scoring and prompt optimization
