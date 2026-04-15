# AI内容工厂 - 项目状态

> 工作约定（2026-04-13 起）：当 Jonny 询问“最新状态 / 进展 / 仓库情况”时，默认流程不再是只汇报，而是“先检查状态，再主动推进一小段代码，最后一起汇报结果”。详见 `WORKFLOW.md`。


## ✅ 已完成

### 图像生成功能（完全可用）
- ✅ Hugging Face Stable Diffusion XL集成
- ✅ 产品封面图生成（4种风格：现代、可爱、奢华、极简）
- ✅ 自定义图片生成
- ✅ 批量图片生成
- ✅ 所有测试通过

### 生成的文件
```
output/
├── cover_智能降噪耳机_1773281541847.png    (69KB - 现代风格)
├── cover_智能降噪耳机_1773281616127.png    (66KB - 现代风格)
├── cover_智能降噪耳机_1773281676628.png    (48KB - 现代风格)
├── cover_智能降噪耳机_1773281703484.png    (现代风格)
├── cover_智能降噪耳机_1773281714802.png    (可爱风格)
├── custom_cat.png                          (自定义图片)
├── image_1773281737958_0.png              (批量生成)
├── image_1773281749533_1.png              (批量生成)
└── image_1773281761098_2.png              (批量生成)
```

## ⚠️ TTS功能（暂时不可用）

### 问题
Hugging Face的TTS模型API当前不可用（返回404错误）

### 可用TTS替代方案

#### 方案1：Edge-TTS（推荐，完全免费）
```bash
# 需要先安装pip
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py --user

# 安装edge-tts
python3 -m pip install edge-tts --user
```

然后创建Python脚本：
```python
# tts.py
import edge_tts
import sys

text = sys.argv[1] if len(sys.argv) > 1 else "Hello"
communicate = edge_tTS.Communicate(text, "zh-CN-XiaoxiaoNeural")
await communicate.save("output.mp3")
```

#### 方案2：Azure TTS（免费5小时/月）
- 注册：https://azure.microsoft.com/zh-cn/services/cognitive-services/text-to-speech/
- 获取免费API key
- 集成到项目中

#### 方案3：第三方免费API
- https://www.voicerss.org/（每月免费350次）
- https://cloud.google.com/text-to-speech（免费层）

## 📊 免费额度

### Hugging Face（当前可用）
- ✅ 图像生成：每月1000次
- ❌ TTS：暂时不可用

### Edge-TTS（完全免费）
- ✅ 无限使用
- ❌ 需要Python环境

## 🚀 如何使用

### 运行图像生成测试
```bash
cd /root/.openclaw/workspace-makemoney_jonny/ai-content-factory
npx ts-node test-image.ts
```

### 代码示例
```typescript
import { ImageService } from './src/index';

const imageService = new ImageService('your_huggingface_api_key');

// 生成产品封面
const cover = await imageService.generateProductCover('产品名称', 'modern');
console.log('封面图已生成：', cover);

// 批量生成图片
const images = await imageService.generateMultipleImages('产品展示图', 5);
console.log(`生成${images.length}张图片`);
```

## 📁 项目结构
```
ai-content-factory/
├── src/
│   ├── image-service.ts      ✅ 图像生成服务
│   ├── tts-service.ts        ⚠️ TTS服务（暂时不可用）
│   └── index.ts
├── test-image.ts             ✅ 图像测试
├── test-tts.ts               ⚠️ TTS测试
├── test-all.ts               ⚠️ 完整测试（TTS部分失败）
├── output/                   ✅ 生成的文件
├── .env
├── tsconfig.json
└── package.json
```

## 💡 建议

1. **短期**：先使用图像生成功能，TTS稍后解决
2. **中期**：集成Edge-TTS或Azure TTS
3. **长期**：考虑自部署TTS模型

## 🔧 最近修复

- 修复 `story-cli.ts` / `short-drama-cli.ts` 的帮助模式：`--help` 现在直接输出 usage 并正常退出
- 去掉 CLI 顶层 `await`，避免当前 TS 配置下的编译报错
- 为 CLI 补齐 `commander` 依赖
- 入口导出改为真实存在的函数/类型，避免 `src/index.ts` 导出不存在符号导致 `tsc` 失败
- config / template 缺失时使用默认值，参数预检和 dry-run 更稳

## 🎯 下一步

1. 测试图像生成效果
2. 选择并集成TTS方案
3. 添加文本生成功能
4. 集成到Waoowaoo项目
