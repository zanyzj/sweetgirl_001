import { config } from 'dotenv';
import { generateCharacterImage } from '@/lib/ai/image-generator';

config({ path: '.env.local' });

async function main() {
  console.log('=== 图生图测试 ===');
  console.log('角色: sister');
  console.log('开始调用火山引擎生成图片...');
  console.log('');

  try {
    const result = await generateCharacterImage('sister');
    
    if (result) {
      console.log('=== 测试成功 ===');
      console.log('R2 公开 URL:', result);
      console.log('');
      console.log('你可以复制上面的 URL 到浏览器查看生成的图片');
    } else {
      console.log('=== 测试失败 ===');
      console.log('图片生成失败，返回 null');
    }
  } catch (error) {
    console.error('=== 测试失败 ===');
    console.error(error);
    process.exit(1);
  }
}

main();
