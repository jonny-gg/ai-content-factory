// test-daily.js - 测试每日任务（小规模）
const { dailyTask } = require('./daily-job.js');

// 测试配置：只生成2张图
async function smallScaleTest() {
  console.log('=================================');
  console.log('小规模每日任务测试');
  console.log('=================================\n');
  console.log('⚠️ 只生成2张图片用于测试\n');

  // 为了测试，修改ImageService只生成2张
  const fetch = require('node-fetch');
  const fs = require('fs');
  const path = require('path');
  
  class TestImageService {
    constructor() {
      this.apiKey = 'process.env.HF_API_KEY';
    }

    async generateProductCover(productName, style = 'modern') {
      const prompt = `Product cover for "${productName}", modern style, white background`;
      const response = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt
        })
      });

      const buffer = await response.buffer();
      const outputPath = path.join(process.cwd(), 'output', `test_${productName}_${Date.now()}.png`);
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }

  const imageService = new TestImageService();

  console.log('📋 生成2张产品封面图...');
  
  const products = ['测试产品1', '测试产品2'];
  for (const product of products) {
    console.log(`   🎨 生成：${product}`);
    await imageService.generateProductCover(product);
    console.log(`   ✅ 完成\n`);
  }

  console.log('=================================');
  console.log('✅ 测试完成！');
  console.log('=================================\n');
}

smallScaleTest().catch(console.error);
