# AI内容工厂

基于AI的图像生成和语音合成工具，支持免费使用Hugging Face和Edge-TTS API。

## 功能

- ✅ 使用Hugging Face Stable Diffusion XL生成高质量图像
- ✅ 使用Edge-TTS生成高质量中文语音（完全免费）
- ✅ 支持多种产品封面风格（现代、可爱、奢华、极简）
- ✅ 支持批量生成图片
- ✅ 支持多种中文语音

## 安装

```bash
npm install
```

## 配置

已配置Hugging Face API Key，无需额外配置。

## 使用

### 运行完整测试（推荐）

```bash
npx ts-node test-all.ts
```

### 仅测试图像生成

```bash
npx ts-node test-image.ts
```

### 仅测试语音合成

```bash
npx ts-node test-tts.ts
```

## 查看结果

生成的文件保存在 `./output/` 目录下：
- 图片：PNG格式
- 音频：MP3格式

## 代码示例

```typescript
import { ImageService, TTSService } from './src/index';

// 创建服务
const imageService = new ImageService();
const ttsService = new TTSService();

// 生成产品封面
const coverImage = await imageService.generateProductCover('产品名称', 'modern');

// 生成语音
const audio = await ttsService.generateProductVoiceover(
  '产品名称',
  '产品描述',
  'zh-CN-XiaoxiaoNeural'
);
```

## 可用语音风格

- 晓晓：活泼女声（zh-CN-XiaoxiaoNeural）
- 晓伊：温柔女声（zh-CN-XiaoyiNeural）
- 云健：沉稳男声（zh-CN-YunjianNeural）
- 云希：稳重男声（zh-CN-YunxiNeural）
- 晓涵：知性女声（zh-CN-XiaohanNeural）
- 晓梦：甜美女声（zh-CN-XiaomengNeural）

## 免费额度

- Hugging Face：每月1000次API调用
- Edge-TTS：完全免费，无限制

## Story / Short-Drama CLI

新增两个可直接调用的入口：

```bash
npm run story -- --help
npm run short-drama -- --help
```

也支持安全预检：

```bash
npm run story -- --dry-run
npm run short-drama -- --dry-run
```

说明：
- `--help` 现在只打印帮助，不会误触发生成流程
- 缺失的 config / template 文件会自动回退到默认值，不会在参数解析阶段直接崩溃

## Monetization-first Topic Ranking

现在可以直接按“更容易变现”来筛题：

```bash
npm run topics:monetize -- 10
npm run topics:monetize -- 10 --diverse --max-per-niche=1 --min-distinct=3
```

输出内容：
- Top N 选题 JSON
- Top N 选题 Markdown
- 每个题材的变现建议 / Hook / CTA / 执行角度
- 可选开启多样性重排，避免 Top 结果被单一赛道垄断

评分维度来自：
- `configs/monetization-rubric.json`

你可以自己调：
- 各维度权重
- 每个赛道基础分
- 关键词触发 bonus
- 每个赛道适合卖什么产品/服务

## Top Topics → Execution Assets

现在还可以把最新一轮变现选题，直接转成可执行素材包：

```bash
npm run topics:assets -- 3 douyin
npm run topics:assets -- 3 douyin --prefer-diverse
npm run topics:assets -- 3 douyin --diverse-only
npm run topics:daily
npm run topics:summary
```

会自动读取最新的 `monetized-topics-*.json`，为 Top 3 生成：
- `story-package.json`
- `publish-copy.txt`
- `shot-list.md`
- `platform-copies.json`
- `delivery-checklist.md`

参数说明：
- `--prefer-diverse`：优先读取最近一次 diversified 结果，没有则回退到最新普通结果
- `--diverse-only`：只读取 diversified 结果，没有就报错
- `npm run topics:daily`：一键完成 diversified 排名 + Top3 执行包生成 + daily dashboard
- `npm run topics:summary`：基于最新 ranking + execution pack 生成今日发布建议总览

适合先做“题材筛选 → 今日执行包 → 今日发布决策”闭环，不依赖外部模型也能直接产出。

## 下一步

- 集成到Waoowaoo项目
- 添加文本生成功能（智谱AI/Groq）
- 添加多平台发布功能
