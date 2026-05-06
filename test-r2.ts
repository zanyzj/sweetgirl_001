import { config } from 'dotenv';
import { uploadImageFromUrl } from './src/lib/storage/r2';

config({ path: '.env.local' });

async function test() {
  const sourceUrl = 'https://pub-f0cb2c49a4434ad5a65e810e360b63f0.r2.dev/references/sister.jpg';
  const prefix = 'test';

  console.log('R2_BUCKET:', process.env.R2_BUCKET);
  console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);

  try {
    console.log('开始测试 uploadImageFromUrl...');
    const result = await uploadImageFromUrl(sourceUrl, prefix);
    console.log('测试成功! 返回的 URL:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

test();
