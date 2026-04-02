// src/image-service.ts
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

export class ImageService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HF_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not found. Please set HF_API_KEY environment variable.');
    }
  }

  // 使用Hugging Face生成图像
  async generateImage(prompt: string, options?: {
    width?: number;
    height?: number;
    steps?: number;
    negativePrompt?: string;
  }): Promise<Buffer> {
    const response = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: options?.width || 1024,
          height: options?.height || 1024,
          num_inference_steps: options?.steps || 30,
          guidance_scale: 7.5,
          negative_prompt: options?.negativePrompt || 'blurry, low quality, distorted, watermark, text, logo'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    return await response.buffer();
  }

  // 生成并保存图片
  async generateAndSave(prompt: string, outputPath: string, options?: {
    width?: number;
    height?: number;
    steps?: number;
    negativePrompt?: string;
  }): Promise<string> {
    const imageBuffer = await this.generateImage(prompt, options);

    // 确保输出目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 保存图片
    fs.writeFileSync(outputPath, imageBuffer);

    return outputPath;
  }

  // 生成产品封面图
  async generateProductCover(productName: string, style: 'modern' | 'cute' | 'luxury' | 'minimalist' = 'modern'): Promise<string> {
    const stylePrompts = {
      modern: `High quality product cover image for "${productName}", modern minimalist style, bright lighting, white background, 4K resolution, professional product photography, clean composition`,
      cute: `Cute style product cover image for "${productName}", fresh and lively style, soft colors, warm atmosphere, kawaii style, bright and cheerful`,
      luxury: `Luxurious style product cover image for "${productName}", premium quality, golden accents, dark background, 4K resolution, high-end product photography, elegant composition`,
      minimalist: `Minimalist style product cover image for "${productName}", lots of white space, black and white color scheme, premium feel, clean design, simple and elegant`
    };

    const timestamp = Date.now();
    const outputPath = path.join(process.cwd(), 'output', `cover_${productName}_${timestamp}.png`);

    await this.generateAndSave(stylePrompts[style], outputPath);

    return outputPath;
  }

  // 批量生成图片
  async generateMultipleImages(prompt: string, count: number): Promise<string[]> {
    const imagePaths: string[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const outputPath = path.join(process.cwd(), 'output', `image_${timestamp}_${i}.png`);
      await this.generateAndSave(prompt, outputPath);
      imagePaths.push(outputPath);
    }

    return imagePaths;
  }
}
