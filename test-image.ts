// test-image.ts - 测试图像生成
import { ImageService } from './src/index';

async function testImageGeneration() {
  console.log('=================================');
  console.log('测试图像生成功能');
  console.log('=================================\n');

  const hfApiKey = process.env.HF_API_KEY;
  if (!hfApiKey) throw new Error('Please set HF_API_KEY in environment variables');
  const imageService = new ImageService(hfApiKey);

  try {
    // 测试1：生成简单的产品封面
    console.log('测试1：生成产品封面图（现代风格）...');
    const cover1 = await imageService.generateProductCover('智能降噪耳机', 'modern');
    console.log(`✅ 图片生成成功！保存在: ${cover1}\n`);

    // 测试2：生成可爱的产品封面
    console.log('测试2：生成产品封面图（可爱风格）...');
    const cover2 = await imageService.generateProductCover('智能降噪耳机', 'cute');
    console.log(`✅ 图片生成成功！保存在: ${cover2}\n`);

    // 测试3：生成自定义图片
    console.log('测试3：生成自定义图片...');
    const timestamp = Date.now();
    const customImage = await imageService.generateAndSave(
      'A cute cat sitting on a modern chair, high quality, 4K resolution, professional photography, bright lighting',
      './output/custom_cat.png'
    );
    console.log(`✅ 自定义图片生成成功！保存在: ${customImage}\n`);

    // 测试4：批量生成图片
    console.log('测试4：批量生成图片（3张）...');
    const batchImages = await imageService.generateMultipleImages(
      'Product showcase image, clean white background, professional lighting',
      3
    );
    console.log(`✅ 批量生成完成！共生成 ${batchImages.length} 张图片:`);
    batchImages.forEach((img, i) => console.log(`   ${i + 1}. ${img}`));
    console.log();

    console.log('=================================');
    console.log('✅ 所有测试通过！');
    console.log('=================================');
    console.log('\n图片保存在 ./output/ 目录下');
    console.log('你可以查看这些图片来验证生成效果\n');

  } catch (error) {
    console.error('❌ 测试失败：', error);
  }
}

testImageGeneration();
