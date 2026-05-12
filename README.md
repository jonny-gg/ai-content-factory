# ai-content-factory

一个用 TypeScript 编排的 AI 内容生产流水线仓库，面向短视频 / 短剧场景，覆盖 **选题 → 故事包 → 素材 → 渲染 → 交付 → 日报编排**。

## 这个仓库是干嘛的

它把内容生产拆成几条可组合的流水线：

- **Story pipeline**：把一个主题生成成结构化故事包
- **Assets pipeline**：基于故事包生成图片和音频素材
- **Render pipeline**：把素材与字幕渲染成 9:16 成片
- **Chapter pipeline**：把章节生产包转成整条短剧交付链路
- **Daily job**：自动串起选题、执行包和日报输出

核心产物通常会落到 `output/` 下的运行目录中，例如：
- `story-package.json`
- `publish-meta.json`
- `publish-copy.txt`
- `shot-list.md`
- `asset-manifest.json`
- `render-manifest.json`
- `delivery-manifest.json`

## 核心流程与代码位置

| 流程 | 公开命令 | 主要代码位置 |
| --- | --- | --- |
| 故事包生成 | `npm run story -- --topic "AI副业"` | `src/cli/story.ts` → `src/story-factory.ts` → `src/pipelines/generate-story-package.ts` → `src/engines/story/story-engine.ts` |
| 素材生成 | `npm run assets -- --story-package <path>` | `src/cli/assets.ts` → `src/assets-factory.ts` → `src/pipelines/generate-assets.ts` |
| 视频渲染 | `npm run render -- --story-package <path> --asset-manifest <path>` | `src/cli/render.ts` → `src/render-factory.ts` → `src/pipelines/render-video.ts` |
| 全链路生产 | `npm run full -- --topic "AI副业"` | `src/cli/full-pipeline.ts` → `src/full-pipeline.ts` |
| 章节短剧 | `npm run chapter:full -- --chapter-pack <path>` | `src/cli/chapter-full.ts` → `src/chapter-full-pipeline.ts` → `src/chapter-adapter.ts` |
| 交付导出 | `npm run delivery -- --run-dir <path>` | `src/cli/delivery-export.ts` → `src/delivery-export-factory.ts` → `src/delivery-kit.ts` |
| 日报编排 | `npm run daily` | `scripts/daily-job.js` → `src/daily-job.ts` |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`，按你要跑的流程补变量。

最常见的依赖关系：

- **故事 / 全链路 / 日报**：当前运行时配置要求 `LLM_API_KEY`
- **图片生成**：需要 `HF_API_KEY`
- **Google TTS**：默认可用，不需要额外 API key
- **VoiceRSS TTS**：需要 `VOICERSS_API_KEY`
- **Telegram 通知**：可选，使用 `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`
- **真实视频渲染**：需要本机安装 `ffmpeg`

### 3. 先跑一个最小 smoke path

只验证 CLI 参数、配置读取和目录组织是否正常：

```bash
npm run story -- --topic "AI副业" --dry-run
```

### 4. 跑实际故事包生成

```bash
npm run story -- --topic "AI副业"
```

### 5. 补素材或继续走全链路

```bash
npm run assets -- --story-package output/runs/<run-id>/story-package.json
npm run full -- --topic "AI副业" --dry-run
```

## 常用命令

### 内容生产

```bash
npm run story -- --topic "AI副业"
npm run short-drama -- --topic "AI副业"
npm run assets -- --story-package <path>
npm run render -- --story-package <path> --asset-manifest <path>
npm run full -- --topic "AI副业"
npm run delivery -- --run-dir <path>
```

### 章节流水线

```bash
npm run chapter -- --chapter-pack <path>
npm run chapter:full -- --chapter-pack <path>
npm run chapter:batch -- --index <path>
```

### 选题 / 日报辅助脚本

```bash
npm run topics:pick -- horror 5
npm run topics:monetize -- 10
npm run topics:monetize:diverse
npm run topics:assets -- 3 douyin --diverse-only
npm run topics:summary
npm run daily
```

### 验证

```bash
npm run typecheck
npm run test
npm run test:image
npm run test:tts
npm run test:all
```

## 目录结构

```text
ai-content-factory/
├── configs/                  # 运行配置与示例数据
├── docs/
│   ├── architecture/         # 架构文档与图示
│   ├── operations/           # 运维 / 工作流 / 部署说明
│   └── project/              # 项目背景、规划、状态文档
├── openspec/                 # 变更提案与规格
├── scripts/                  # 一次性脚本、日报编排、手动验证脚本
│   └── manual-tests/
├── src/
│   ├── cli/                  # 公开 CLI 入口
│   ├── core/                 # 共享类型与 run context
│   ├── engines/              # 业务引擎
│   └── pipelines/            # 组合式流水线
├── tests/                    # 自动化测试
└── story-assets/             # 资产样例 / 中间文件
```

## 从哪里开始读代码

- 想看仓库主链路：先读 `docs/architecture/overview.md`
- 想看故事包生成：`src/story-factory.ts`、`src/pipelines/generate-story-package.ts`
- 想看素材生成：`src/assets-factory.ts`、`src/pipelines/generate-assets.ts`
- 想看渲染：`src/render-factory.ts`、`src/pipelines/render-video.ts`
- 想看章节短剧：`src/chapter-adapter.ts`、`src/chapter-full-pipeline.ts`
- 想看日报编排：`src/daily-job.ts`、`scripts/topic-monetization.ts`、`scripts/topics-to-assets.ts`

## 文档导航

- 架构总览：`docs/architecture/overview.md`
- 项目摘要：`docs/project/PROJECT-SUMMARY.md`
- 当前状态：`docs/project/STATUS.md`
- 工作流约定：`docs/operations/WORKFLOW.md`
- 交付与运维：`docs/operations/DELIVERY-PLAYBOOK.md`、`docs/operations/DAILY-AUTO.md`

## 当前约束

- 当前 `loadRuntimeConfig()` 仍会要求非 dry-run 的 CLI 流程具备 `LLM_API_KEY`，即使故事生成核心引擎是本地模板化实现。
- `scripts/manual-tests/` 下的脚本偏向人工验证，不等同于 `tests/` 下的自动化测试。
- `render` / `chapter:full` 的真实输出依赖本地 `ffmpeg`。
