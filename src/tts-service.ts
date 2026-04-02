// src/tts-service.ts
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

export class TTSService {
  // 使用无需注册的免费TTS API
  async generateSpeechWithEdgeTTS(
    text: string,
    voice: string = 'zh-CN-XiaoxiaoNeural',
    outputPath?: string
  ): Promise<Buffer> {
    // 使用Google Translate TTS（完全免费，无需API key）
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=zh-CN`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.statusText}`);
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

  // 使用VoiceRSS（免费350次/月，需要API key）
  async generateSpeechWithVoiceRSS(
    text: string,
    voice: string = 'zh-cn',
    outputPath?: string
  ): Promise<Buffer> {
    const apiKey = process.env.VOICERSS_API_KEY;
    if (!apiKey) {
      throw new Error('VoiceRSS API key not found. To use VoiceRSS, set VOICERSS_API_KEY in .env');
    }

    const url = `http://api.voicerss.org/?key=${apiKey}&hl=${voice}&src=${encodeURIComponent(text)}&c=MP3&f=16khz_16bit_stereo`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`VoiceRSS API error: ${response.statusText}`);
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

  // 智能选择TTS服务
  async generateSpeech(
    text: string,
    options?: {
      voice?: string;
      provider?: 'google-tts' | 'voicerss';
      outputPath?: string;
    }
  ): Promise<Buffer> {
    const provider = options?.provider || 'google-tts';
    const voice = options?.voice || 'zh-CN';
    const outputPath = options?.outputPath;

    switch (provider) {
      case 'google-tts':
        console.log('Using Google TTS (free, no API key required)...');
        return await this.generateSpeechWithEdgeTTS(text, voice, outputPath);

      case 'voicerss':
        console.log('Using VoiceRSS...');
        return await this.generateSpeechWithVoiceRSS(text, voice, outputPath);

      default:
        return await this.generateSpeechWithEdgeTTS(text, voice, outputPath);
    }
  }

  // 为产品生成介绍语音
  async generateProductVoiceover(
    productName: string,
    description: string,
    options?: {
      voice?: string;
      provider?: 'google-tts' | 'voicerss';
    }
  ): Promise<string> {
    const text = `${productName}，${description}`;
    const timestamp = Date.now();
    const outputPath = path.join(process.cwd(), 'output', `voiceover_${productName}_${timestamp}.mp3`);

    await this.generateSpeech(text, { ...options, outputPath });

    return outputPath;
  }

  // 批量生成语音
  async generateMultipleSpeeches(
    texts: string[],
    options?: {
      voice?: string;
      provider?: 'google-tts' | 'voicerss';
    }
  ): Promise<string[]> {
    const audioPaths: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const timestamp = Date.now();
      const outputPath = path.join(process.cwd(), 'output', `speech_${timestamp}_${i}.mp3`);
      await this.generateSpeech(texts[i], { ...options, outputPath });
      audioPaths.push(outputPath);
    }

    return audioPaths;
  }

  // 获取可用语音列表
  getAvailableVoices() {
    return {
      // Google TTS - 中文
      'zh-CN': '中文（简体）',
      'zh-TW': '中文（繁体）',
      'zh-HK': '中文（香港）',
      
      // Google TTS - 常用语言
      'en-US': '英语（美国）',
      'en-GB': '英语（英国）',
      'ja-JP': '日语',
      'ko-KR': '韩语',
      
      // VoiceRSS - 中文
      'zh-cn': '中文（简体） - VoiceRSS',
      'zh-tw': '中文（繁体） - VoiceRSS'
    };
  }
}
