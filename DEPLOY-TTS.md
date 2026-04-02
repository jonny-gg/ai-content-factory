# TTS服务部署指南

## 🚀 快速部署（推荐）

### 方法1：使用部署脚本（最简单）

```bash
cd /root/.openclaw/workspace-makemoney_jonny/ai-content-factory

# 给脚本执行权限
chmod +x deploy-tts.sh

# 运行部署脚本
./deploy-tts.sh
```

### 方法2：手动部署

```bash
# 1. 拉取镜像
docker pull travisvn/openai-edge-tts:latest

# 2. 运行容器
docker run -d \
  --name openai-edge-tts \
  -p 5050:5050 \
  -e API_KEY=my_ai_factory_key \
  -e PORT=5050 \
  -e DEFAULT_VOICE=zh-CN-XiaoxiaoNeural \
  travisvn/openai-edge-tts:latest

# 3. 测试API
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my_ai_factory_key" \
  -d '{"model":"tts-1","input":"你好，这是测试","voice":"zh-CN-XiaoxiaoNeural"}' \
  --output test.mp3

# 4. 播放测试文件
# （用你的音频播放器打开test.mp3）
```

---

## ✅ 验证部署

```bash
# 1. 检查容器状态
docker ps | grep openai-edge-tts

# 2. 查看服务日志
docker logs openai-edge-tts

# 3. 运行完整测试
npx ts-node test-all.ts
```

---

## 🛠️ 管理命令

### 查看服务状态
```bash
docker ps | grep openai-edge-tts
```

### 查看服务日志
```bash
docker logs openai-edge-tts
```

### 停止服务
```bash
docker stop openai-edge-tts
```

### 启动服务
```bash
docker start openai-edge-tts
```

### 删除服务
```bash
docker stop openai-edge-tts
docker rm openai-edge-tts
```

### 重启服务
```bash
docker restart openai-edge-tts
```

---

## ⚙️ 配置说明

### 环境变量

在 `docker run` 命令中可以配置以下变量：

| 变量 | 默认值 | 说明 |
|-------|---------|------|
| API_KEY | - | API密钥（可以任意值） |
| PORT | 5050 | 服务端口 |
| DEFAULT_VOICE | en-US-AvaNeural | 默认语音 |
| DEFAULT_RESPONSE_FORMAT | mp3 | 默认音频格式 |
| DEFAULT_SPEED | 1.0 | 默认语速 |
| REQUIRE_API_KEY | True | 是否需要API key |
| DEFAULT_LANGUAGE | en-US | 默认语言 |

### 推荐配置（中文环境）

```bash
docker run -d \
  --name openai-edge-tts \
  -p 5050:5050 \
  -e API_KEY=my_ai_factory_key \
  -e PORT=5050 \
  -e DEFAULT_VOICE=zh-CN-XiaoxiaoNeural \
  -e DEFAULT_LANGUAGE=zh-CN \
  -e DEFAULT_RESPONSE_FORMAT=mp3 \
  -e DEFAULT_SPEED=1.0 \
  -e REQUIRE_API_KEY=True \
  travisvn/openai-edge-tts:latest
```

---

## 🔧 故障排查

### 问题1：端口已被占用

**现象：** 无法启动服务，提示端口占用

**解决：**
```bash
# 查看占用端口的进程
lsof -Pi :5050 -sTCP:LISTEN -t

# 方法1：停止占用端口的进程
kill -9 <PID>

# 方法2：使用其他端口
docker run -d -p 5051:5050 ...
# 同时修改 .env 中的 EDGE_TTS_ENDPOINT=http://localhost:5051
```

### 问题2：Docker未安装

**现象：** 命令 `docker` 不存在

**解决：**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# CentOS/RHEL
yum install docker

# Mac
# 从 https://www.docker.com/products/docker-desktop 下载安装
```

### 问题3：服务无法连接

**现象：** 测试失败，提示连接错误

**解决：**
```bash
# 1. 检查服务是否运行
docker ps | grep openai-edge-tts

# 2. 检查端口是否正确
docker port openai-edge-tts

# 3. 查看服务日志
docker logs openai-edge-tts

# 4. 检查防火墙
# 如果使用云服务器，需要开放5050端口
```

---

## 📊 可用语音列表

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

## 💡 使用示例

### 生成产品介绍语音

```typescript
import { TTSService } from './src/index';

const ttsService = new TTSService();

// 生成产品介绍
const audioPath = await ttsService.generateProductVoiceover(
  '智能降噪耳机',
  '您的最佳选择，品质保证，值得信赖',
  { provider: 'openai-edge', voice: 'zh-CN-XiaoxiaoNeural' }
);

console.log('语音已生成：', audioPath);
```

### 批量生成语音

```typescript
const audioPaths = await ttsService.generateMultipleSpeeches(
  [
    '第一段文字',
    '第二段文字',
    '第三段文字'
  ],
  { provider: 'openai-edge', voice: 'zh-CN-XiaoxiaoNeural' }
);

console.log(`生成${audioPaths.length}段语音`);
```

---

## 🎯 下一步

1. ✅ 部署TTS服务
2. ✅ 运行测试脚本验证
3. ✅ 运行完整功能测试
4. ✅ 开始使用AI内容工厂

**所有功能就绪，可以开始商业化！**
