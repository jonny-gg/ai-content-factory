// test-all.ts - 完整测试：图像 + 语音
import { ImageService, TTSService } from './src/index';
import * as fs from 'fs';
import * as path from 'path';

async function runFullTest() {
  console.log('=================================');
  console.log('AI内容工厂 - 完整功能测试');
  console.log('=================================\n');

  const hfApiKey = 'process.env.HF_API_KEY';
  const imageService = new ImageService(hfApiKey);
  const ttsService = new TTSService();

  try {
    console.log('📦 产品名称：智能降噪耳机\n');

    // 1. 生成产品封面图
    console.log('🎨 步骤1：生成产品封面图（现代风格）...');
    const coverImage = await imageService.generateProductCover('智能降噪耳机', 'modern');
    console.log(`   ✅ 封面图已生成：${path.basename(coverImage)}`);
    console.log(`   📊 文件大小：${(fs.statSync(coverImage).size / 1024).toFixed(2)} KB\n`);

    // 2. 生成产品介绍语音（Google TTS - 完全免费）
    console.log('🎙️ 步骤2：生成产品介绍语音（Google TTS - 完全免费）...');
    const productVoiceover = await ttsService.generateProductVoiceover(
      '智能降噪耳机',
      '让您在嘈杂的环境中享受纯净音乐，高品质音质，舒适佩戴，您的最佳选择',
      { provider: 'google-tts', voice: 'zh-CN' }
    );
    console.log(`   ✅ 语音已生成：${path.basename(productVoiceover)}`);
    console.log(`   📊 文件大小：${(fs.statSync(productVoiceover).size / 1024).toFixed(2)} KB\n`);

    // 3. 生成更多测试语音
    console.log('🎵 步骤3：生成不同语言的语音...');

    const testTexts = [
      { text: '欢迎使用AI内容工厂', lang: 'zh-CN', name: '中文' },
      { text: 'Welcome to AI Content Factory', lang: 'en-US', name: '英语' },
      { text: 'AIコンテンツファクトリーへようこそ', lang: 'ja-JP', name: '日语' }
    ];

    for (const t of testTexts) {
      const timestamp = Date.now();
      const outputPath = `./output/test_${t.name}_${timestamp}.mp3`;
      await ttsService.generateSpeech(t.text, {
        provider: 'google-tts',
        voice: t.lang,
        outputPath
      });
      console.log(`   ✅ ${t.name}语音已生成：${path.basename(outputPath)}`);
    }

    console.log();

    console.log('=================================');
    console.log('✅ 完整测试成功！');
    console.log('=================================');
    console.log('\n📁 生成的文件：');
    console.log(`   📷 图片：${path.basename(coverImage)}`);
    console.log(`   🎵 主音频：${path.basename(productVoiceover)}`);
    console.log(`   🎵 测试音频：3个不同语言的语音\n`);

    console.log('💡 提示：');
    console.log('   - 这些文件保存在 ./output/ 目录下');
    console.log('   - 你可以查看图片和播放音频来验证效果\n');

    // 统计输出目录
    const outputFiles = fs.readdirSync('./output');
    console.log('=================================');
    console.log('📊 输出目录统计：');
    console.log('=================================');
    console.log(`   总文件数：${outputFiles.length}`);
    console.log(`   总大小：${(outputFiles.reduce((sum, f) => sum + fs.statSync(path.join('./output', f)).size, 0) / 1024).toFixed(2)} KB`);
    console.log();

    console.log('=================================');
    console.log('🎉 恭喜！你的AI内容工厂已经可以使用了！');
    console.log('=================================\n');
    console.log('💰 商业化路径：');
    console.log('   1. 图像生成服务：每张10-50元');
    console.log('   2. 语音生成服务：每段5-20元');
    console.log('   3. 订阅制服务：月费299-999元');
    console.log('   4. 企业定制：每单500-5000元\n');
    console.log('\n💡 TTS方案：');
    console.log('   ✅ Google TTS：完全免费，无需API key');
    console.log('   ✅ 图像生成：Hugging Face，每月1000次');
    console.log('   🎉 总成本：$0\n');

  } catch (error) {
    console.error('❌ 测试失败：', error);
  }
}

runFullTest();
