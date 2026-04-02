# TTS语音合成 - 最佳方案

## 🎯 推荐方案：OpenAI Edge TTS（自部署）

**GitHub:** https://github.com/travisvn/openai-edge-tts
**Stars:** 1.7k
**优点:**
- ✅ 完全免费（使用Microsoft Edge服务）
- ✅ 兼容OpenAI API格式
- ✅ 支持中文语音
- ✅ 高质量输出
- ✅ 自部署，完全控制
- ✅ 无需API key（自己设置）

---

## 🚀 快速部署（3分钟）

### 方式1：Docker部署（推荐）

```bash
# 1. 拉取镜像
docker pull travisvn/openai-edge-tts:latest

# 2. 运行容器（端口5050）
docker run -d -p 5050:5050 \
  -e API_KEY=my_api_key \
  -e PORT=5050 \
  travisvn/openai-edge-tts:latest

# 3. 测试API
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my_api_key" \
  -d '{
    "model": "tts-1",
    "input": "你好，这是一个测试",
    "voice": "zh-CN-XiaoxiaoNeural",
    "response_format": "mp3"
  }' \
  --output test.mp3
```

### 方式2：源码部署

```bash
# 1. 克隆项目
git clone https://github.com/travisvn/openai-edge-tts.git
cd openai-edge-tts

# 2. 配置环境变量
echo "API_KEY=my_api_key" > .env
echo "PORT=5050" >> .env
echo "DEFAULT_VOICE=zh-CN-XiaoxiaoNeural" >> .env

# 3. 运行（需要Python 3.9+）
pip install -r requirements.txt
python app/server.py
```

---

## 📡 可用语音（中文）

### 中文女声
- `zh-CN-XiaoxiaoNeural` - 晓晓（活泼）
- `zh-CN-XiaoyiNeural` - 晓伊（温柔）
- `zh-CN-XiaohanNeural` - 晓涵（知性）
- `zh-CN-XiaomengNeural` - 晓梦（甜美）
- `zh-CN-XiaoxuanNeural` - 晓萱（可爱）

### 中文男声
- `zh-CN-YunjianNeural` - 云健（沉稳）
- `zh-CN-YunxiNeural` - 云希（稳重）
- `zh-CN-YunyangNeural` - 云扬（年轻）
- `zh-CN-YunzeNeural` - 云泽（成熟）

---

## 🔗 集成到项目

### 更新TTS服务

```typescript
// src/tts-service.ts
async generateSpeechWithOpenAIEdge(
  text: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  outputPath?: string
): Promise<Buffer> {
  const url = 'http://localhost:5050/v1/audio/speech';
  const apiKey = 'my_api_key'; // 你设置的API key

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
      speed: 1.0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Edge TTS error: ${error}`);
  }

  const buffer = await response.buffer();

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
  }

  return buffer;
}
```

---

## 📊 方案对比

| 方案 | 免费/付费 | 部署难度 | 质量评分 | 推荐度 |
|------|-----------|-----------|-----------|--------|
| OpenAI Edge TTS（自部署） | 完全免费 | 简单 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| VoiceRSS | 350次/月 | 极简单 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Fish-Speech（自部署） | 完全免费 | 中等 | ⭐⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 💰 成本分析

### OpenAI Edge TTS（自部署）
- **部署成本:** $0（本地Docker）
- **使用成本:** $0（无限）
- **服务器成本:** $0（本地运行）
- **维护成本:** 低
- **总成本:** $0

### Fish-Speech（GPU服务器）
- **部署成本:** $0（开源）
- **服务器成本:** $50-100/月（GPU）
- **使用成本:** $0（无限）
- **总成本:** $50-100/月

### VoiceRSS
- **部署成本:** $0
- **免费额度:** 350次/月
- **升级费用:** $10/月（5000次）
- **总成本:** $0-10/月

---

## 🎯 最终建议

### 短期（今天）
**部署OpenAI Edge TTS（Docker）**
- 3分钟完成
- 完全免费
- 质量好
- 兼容OpenAI API

### 中期（1个月后）
**保持OpenAI Edge TTS**
- 如果性能满足，继续使用
- 无需更换

### 长期（商业化后）
**混合方案**
- OpenAI Edge TTS（日常）
- Fish-Speech（高质量需求）

---

## ✅ 立即行动

### 第1步：部署TTS服务（5分钟）
```bash
docker run -d -p 5050:5050 \
  -e API_KEY=my_ai_factory_key \
  -e PORT=5050 \
  travisvn/openai-edge-tts:latest
```

### 第2步：测试API（2分钟）
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my_ai_factory_key" \
  -d '{"model":"tts-1","input":"你好，这是测试","voice":"zh-CN-XiaoxiaoNeural","response_format":"mp3"}' \
  --output test.mp3
```

### 第3步：集成到项目（10分钟）
更新TTS服务，添加OpenAI Edge TTS支持

### 第4步：运行完整测试（5分钟）
验证图像+语音都正常工作

---

## 🎉 总结

**最佳方案：OpenAI Edge TTS（自部署）**
- 完全免费
- 部署简单（Docker）
- 质量优秀
- 兼容性好
- 支持中文

**立即开始部署，今天就能用上TTS功能！**
