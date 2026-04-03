# ai-content-factory

基于 AI 的内容生成流水线，面向短视频/带货选题、脚本、素材包与日报输出。

## 现在支持什么
- 选题筛选与变现打分
- `story-llm` 生成短视频故事脚本
- 图像生成与 TTS
- 每日任务 `daily-job.js`
- Telegram 完成/失败通知
- `DRY_RUN` 流程演练
- 按日期归档输出到 `output/YYYY-MM-DD/...`

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env`，至少配置：

```env
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-5.4
HF_API_KEY=optional
TELEGRAM_BOT_TOKEN=optional
TELEGRAM_CHAT_ID=optional
DRY_RUN=false
REQUEST_TIMEOUT_MS=45000
MAX_RETRIES=3
RETRY_BASE_DELAY_MS=1500
OUTPUT_DIR=
```

说明：
- `LLM_API_KEY` 必填
- `LLM_BASE_URL` 默认 `https://api.openai.com/v1`
- `OUTPUT_DIR` 不填时默认落到 `output/YYYY-MM-DD`
- `DRY_RUN=true` 时不会真的发 Telegram，适合走查流程

## 常用命令

### 选题与素材
```bash
npm run topics:monetize:diverse
npm run topics:assets -- 3 douyin --diverse-only
npm run topics:summary
```

### 故事脚本
```bash
npm run story
npm run story:batch
npm run short-drama
```

### 每日流水线
```bash
node daily-job.js
```

### 测试与类型检查
```bash
npm run test
npm run typecheck
npm run test:all
```

## 每日任务说明
`daily-job.js` 现在包含：
- 分阶段日志：`[bootstrap]` / `[topic-pick]` / `[topics-assets]` / `[summary]` / `[notify]`
- timeout 控制
- retry 重试
- dry-run 模式
- 结果写入 `output/YYYY-MM-DD/daily-run-<timestamp>/`
- 失败时写入 `run-error.json`
- 成功时写入 `run-meta.json`

## 输出目录结构
```text
output/
  2026-04-02/
    daily-run-1770000000000/
      run-meta.json
      run-error.json
```

## 运行建议
- 先用 `DRY_RUN=true node daily-job.js` 验证流程
- 确认日志分阶段正常后，再切真实 API
- 如果要做成本优化，优先记录 token usage 并接入真实单价

## 常见问题

### 1. 启动时报 `Missing required environment variables`
说明你缺少必要 env，先补 `.env`。

### 2. Telegram 不发消息
检查：
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- 是否开启了 `DRY_RUN=true`

### 3. `story-llm` 返回格式异常
现在已加 schema 校验。如果模型没按 JSON schema 返回，会直接报错，避免脏数据流入后续流程。

## 工程约定
- 只支持 `responses` wire API
- 默认 OpenAI base URL 为 `https://api.openai.com/v1`
- 输出按日期归档
- `.env`、`.codex/`、`dist/`、`logs/` 不入库
