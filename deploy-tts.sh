#!/bin/bash

# deploy-tts.sh - 部署OpenAI Edge TTS服务

echo "==================================="
echo "部署OpenAI Edge TTS服务"
echo "==================================="
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "   Ubuntu/Debian: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    echo "   CentOS/RHEL: yum install docker"
    echo "   Mac: 下载Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker已安装"
echo ""

# 检查端口5050是否被占用
if lsof -Pi :5050 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口5050已被占用"
    echo "   请关闭占用该端口的服务，或修改.env中的EDGE_TTS_ENDPOINT"
    echo ""
    read -p "是否继续尝试部署？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 拉取Docker镜像
echo "📥 拉取OpenAI Edge TTS镜像..."
docker pull travisvn/openai-edge-tts:latest

if [ $? -ne 0 ]; then
    echo "❌ 镜像拉取失败"
    exit 1
fi

echo "✅ 镜像拉取成功"
echo ""

# 运行容器
echo "🚀 启动OpenAI Edge TTS服务..."
docker run -d \
  --name openai-edge-tts \
  -p 5050:5050 \
  -e API_KEY=my_ai_factory_key \
  -e PORT=5050 \
  -e DEFAULT_VOICE=zh-CN-XiaoxiaoNeural \
  -e DEFAULT_RESPONSE_FORMAT=mp3 \
  -e DEFAULT_SPEED=1.0 \
  -e DEFAULT_LANGUAGE=zh-CN \
  -e REQUIRE_API_KEY=True \
  travisvn/openai-edge-tts:latest

if [ $? -ne 0 ]; then
    echo "❌ 服务启动失败"
    exit 1
fi

echo "✅ 服务启动成功"
echo ""

# 等待服务启动
echo "⏳ 等待服务启动（5秒）..."
sleep 5

# 测试服务
echo "🧪 测试服务连接..."
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my_ai_factory_key" \
  -d '{"model":"tts-1","input":"你好，这是测试","voice":"zh-CN-XiaoxiaoNeural","response_format":"mp3"}' \
  --output test_output.mp3

if [ -f test_output.mp3 ]; then
    echo "✅ 测试成功！"
    echo ""
    echo "==================================="
    echo "🎉 OpenAI Edge TTS部署完成！"
    echo "==================================="
    echo ""
    echo "📍 API地址: http://localhost:5050/v1/audio/speech"
    echo "🔑 API Key: my_ai_factory_key"
    echo "📁 测试文件: test_output.mp3"
    echo ""
    echo "💡 下一步："
    echo "   1. 播放 test_output.mp3 验证语音质量"
    echo "   2. 运行 npx ts-node test-all.ts 测试完整功能"
    echo "   3. 修改 .env 中的 API Key"
    echo ""

    # 清理测试文件
    rm test_output.mp3
else
    echo "❌ 测试失败，请检查服务状态"
    echo ""
    echo "🔍 查看服务日志:"
    echo "   docker logs openai-edge-tts"
    echo ""
    echo "🛑 停止服务:"
    echo "   docker stop openai-edge-tts"
    echo "   docker rm openai-edge-tts"
fi
