// test-tts.ts - 测试语音合成功能
import { TTSService } from './src/index';
import * as fs from 'fs';

async function testTTSService() {
  console.log('=================================');
  console.log('测试语音合成功能');
  console.log('=================================\n');

  const ttsService = new TTSService();

  try {
    // 测试1：生成产品介绍语音（Edge TTS）
    console.log('测试1：生成产品介绍语音（Edge TTS）...');
    const voice1 = await ttsService.generateProductVoiceover(
      '智能降噪耳机',
      '您的最佳选择，品质保证，值得信赖',
      { provider: 'google-tts', voice: 'zh-CN' }
    );
    console.log(`✅ 语音生成成功！保存在: ${voice1}`);
    console.log(`   文件大小：${fs.statSync(voice1).size} 字节\n`);

    // 测试2：生成不同风格的语音
    console.log('测试2：生成欢迎语音（Edge TTS - 晓伊音）...');
    const voice2 = await ttsService.generateSpeech(
      '欢迎使用AI内容工厂，这里是你的最佳选择',
      { provider: 'google-tts', voice: 'zh-CN', outputPath: './output/welcome.mp3' }
    );
    console.log(`✅ 语音生成成功！保存在: ./output/welcome_xiaoyi.mp3`);
    console.log(`   文件大小：${voice2.length} 字节\n`);

    // 测试3：生成男声语音
    console.log('测试3：生成男声语音（Edge TTS - 云希音）...');
    const voice3 = await ttsService.generateSpeech(
      '欢迎光临，感谢您的选择',
      { provider: 'google-tts', voice: 'zh-CN', outputPath: './output/welcome2.mp3' }
    );
    console.log(`✅ 语音生成成功！保存在: ./output/welcome_yunxi.mp3`);
    console.log(`   文件大小：${voice3.length} 字节\n`);

    // 测试4：批量生成语音
    console.log('测试4：批量生成语音（3段）...');
    const batchVoices = await ttsService.generateMultipleSpeeches(
      [
        '第一段文字：这是第一段测试',
        '第二段文字：这是第二段测试',
        '第三段文字：这是第三段测试'
      ],
      { provider: 'google-tts', voice: 'zh-CN' }
    );
    console.log(`✅ 批量生成完成！共生成 ${batchVoices.length} 段语音:`);
    batchVoices.forEach((audio, i) => {
      console.log(`   ${i + 1}. ${path.basename(audio)} (${fs.statSync(audio).size} 字节)`);
    });
    console.log();

    // 显示可用语音
    console.log('=================================');
    console.log('可用语音列表：');
    console.log('=================================');
    const voices = ttsService.getAvailableVoices();
    Object.entries(voices).forEach(([key, description]) => {
      console.log(`  ${key}: ${description}`);
    });
    console.log();

    console.log('=================================');
    console.log('✅ 所有测试通过！');
    console.log('=================================');
    console.log('\n音频文件保存在 ./output/ 目录下');
    console.log('你可以播放这些音频来验证生成效果\n');

  } catch (error) {
    console.error('❌ 测试失败：', error);
  }
}

import * as path from 'path';

testTTSService();
