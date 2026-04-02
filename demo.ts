// demo.ts - 演示AI内容工厂的核心功能
import { ImageService } from './src/index';

async function runDemo() {
  console.log('=================================');
  console.log('AI内容工厂 - 产品演示');
  console.log('=================================\n');

  const hfApiKey = process.env.HF_API_KEY;
  if (!hfApiKey) throw new Error('Please set HF_API_KEY in environment variables');
  const imageService = new ImageService(hfApiKey);

  try {
    // 演示1：生成电商产品封面
    console.log('📦 演示1：电商产品封面\n');
    console.log('产品：智能手表\n');

    const watchCover = await imageService.generateProductCover('智能手表', 'modern');
    console.log(`✅ 已生成：${watchCover}`);
    console.log(`   文件大小：${fs.statSync(watchCover).size} 字节\n`);

    // 演示2：生成可爱风格封面
    console.log('🎀 演示2：可爱风格封面\n');
    console.log('产品：儿童玩具\n');

    const toyCover = await imageService.generateProductCover('儿童玩具', 'cute');
    console.log(`✅ 已生成：${toyCover}`);
    console.log(`   文件大小：${fs.statSync(toyCover).size} 字节\n`);

    // 演示3：生成奢华风格封面
    console.log('💎 演示3：奢华风格封面\n');
    console.log('产品：名表\n');

    const watchLuxury = await imageService.generateProductCover('名表', 'luxury');
    console.log(`✅ 已生成：${watchLuxury}`);
    console.log(`   文件大小：${fs.statSync(watchLuxury).size} 字节\n`);

    // 演示4：批量生成产品图
    console.log('🎨 演示4：批量生成产品图\n');
    console.log('产品：运动鞋\n');

    const shoeImages = await imageService.generateMultipleImages(
      'High quality product photography of sports shoes, white background, professional lighting, 4K resolution',
      3
    );
    console.log(`✅ 已生成 ${shoeImages.length} 张图片:`);
    shoeImages.forEach((img, i) => {
      console.log(`   ${i + 1}. ${path.basename(img)} (${fs.statSync(img).size} 字节)`);
    });
    console.log();

    console.log('=================================');
    console.log('✅ 演示完成！');
    console.log('=================================');
    console.log('\n📁 所有生成的文件保存在 ./output/ 目录');
    console.log('💡 提示：你可以用图片查看器打开这些文件\n');

    // 统计信息
    const outputDir = './output';
    const files = fs.readdirSync(outputDir);
    console.log('📊 输出目录统计：');
    console.log(`   总文件数：${files.length}`);
    console.log(`   总大小：${files.reduce((sum, f) => sum + fs.statSync(path.join(outputDir, f)).size, 0)} 字节\n`);

    console.log('=================================');
    console.log('🎉 AI内容工厂已准备就绪！');
    console.log('=================================\n');
    console.log('💰 商业化建议：');
    console.log('   1. 电商平台：为卖家生成产品图');
    console.log('   2. 小红书：为博主生成封面图');
    console.log('   3. 电商代运营：批量生成素材');
    console.log('   4. 订阅服务：月费299-999元');
    console.log('   5. 按次收费：每张图5-20元\n');

  } catch (error) {
    console.error('❌ 演示失败：', error);
  }
}

import * as fs from 'fs';
import * as path from 'path';

runDemo();
