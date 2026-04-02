// daily-job.js - 每日内容生成任务（可以直接运行）
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 图像服务（内联）
class ImageService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.HF_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not found. Please set HF_API_KEY environment variable.');
    }
  }

  async generateImage(prompt, options = {}) {
    const response = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: options.width || 1024,
          height: options.height || 1024,
          num_inference_steps: options.steps || 30,
          guidance_scale: 7.5,
          negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, watermark, text, logo'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    return await response.buffer();
  }

  async generateAndSave(prompt, outputPath, options = {}) {
    const imageBuffer = await this.generateImage(prompt, options);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, imageBuffer);
    return outputPath;
  }

  async generateProductCover(productName, style = 'modern') {
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
}

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logMessage);
  
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `daily-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage);
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 每日任务
async function dailyTask() {
  const startTime = Date.now();
  
  log('=================================');
  log('每日内容生成任务');
  log(`开始时间：${new Date().toLocaleString('zh-CN')}`);
  log('=================================\n');

  try {
    const imageService = new ImageService(process.env.HF_API_KEY);
    const results = {
      images: [],
      timestamp: new Date().toISOString()
    };

    // 任务1：生成今日热门产品封面图（5张）
    log('📋 任务1：生成今日热门产品封面图（5张）');
    const hotProducts = [
      '智能手机',
      '蓝牙耳机',
      '智能手表',
      '充电宝',
      '无线充电器'
    ];

    for (const product of hotProducts) {
      log(`   🎨 生成：${product}（现代风格）`);
      const imagePath = await imageService.generateProductCover(product, 'modern');
      
      const stats = fs.statSync(imagePath);
      log(`   ✅ 完成：${path.basename(imagePath)} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      results.images.push({
        product,
        path: imagePath,
        size: stats.size,
        style: 'modern'
      });

      // 避免API速率限制
      log('   ⏳ 等待3秒...');
      await sleep(3000);
    }

    // 任务2：生成不同风格的产品图
    log('\n📋 任务2：生成不同风格产品图（5张）');
    const styles = ['modern', 'cute', 'luxury', 'minimalist', 'modern'];
    
    for (let i = 0; i < 5; i++) {
      const productName = `示例产品${i + 1}`;
      log(`   🎨 生成：${productName}（${styles[i]}风格）`);
      
      const imagePath = await imageService.generateProductCover(productName, styles[i]);
      const stats = fs.statSync(imagePath);
      log(`   ✅ 完成：${path.basename(imagePath)} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      results.images.push({
        product: productName,
        path: imagePath,
        size: stats.size,
        style: styles[i]
      });

      await sleep(3000);
    }

    // 保存结果
    const resultsPath = path.join(process.cwd(), 'output', `daily-results-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    log(`\n📊 结果已保存：${path.basename(resultsPath)}`);

    // 统计信息
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2); // 分钟
    const totalSize = results.images.reduce((sum, img) => sum + img.size, 0);
    
    log('\n=================================');
    log('✅ 每日任务完成！');
    log('=================================\n');
    log('📊 统计信息：');
    log(`   • 生成图片总数：${results.images.length} 张`);
    log(`   • 总文件大小：${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    log(`   • 耗时时间：${duration} 分钟`);
    log(`   • 平均每张：${(duration / results.images.length).toFixed(2)} 分钟`);
    log(`   • 保存位置：./output/`);
    log(`\n⏰ 完成时间：${new Date().toLocaleString('zh-CN')}`);

    // 发送通知（如果配置了）
    await sendNotification(results, duration);

  } catch (error) {
    log('\n❌ 任务失败！', 'ERROR');
    log(`错误信息：${error.message}`, 'ERROR');
    log(`错误堆栈：${error.stack}`, 'ERROR');
  }
}

// 发送通知（可选）
async function sendNotification(results, duration) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    log('⚠️ 未配置Telegram通知，跳过');
    return;
  }

  try {
    const totalSize = results.images.reduce((sum, img) => sum + img.size, 0);
    
    const message = `
<b>✅ 每日内容生成完成</b>

📊 <b>统计信息：</b>
• <b>生成图片：</b>${results.images.length} 张
• <b>总大小：</b>${(totalSize / 1024 / 1024).toFixed(2)} MB
• <b>耗时时间：</b>${duration} 分钟

📁 <b>保存位置：</b>
./output/

⏰ <b>完成时间：</b>
${new Date().toLocaleString('zh-CN')}

💰 <b>预计价值：</b>
• 批量零售：约 ${results.images.length * 10}-${results.images.length * 50} 元
• 订阅服务：可支持 ${Math.floor(results.images.length / 5)} 个个人版客户
`;

    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      log('✅ Telegram通知已发送');
    } else {
      log('⚠️ Telegram通知发送失败', 'WARN');
    }

  } catch (error) {
    log(`⚠️ 通知错误：${error.message}`, 'WARN');
  }
}

// 运行任务
if (require.main === module) {
  dailyTask().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { dailyTask, sendNotification };
