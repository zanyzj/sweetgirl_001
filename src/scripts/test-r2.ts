import { config } from 'dotenv';
import { uploadImageFromUrl } from '@/lib/storage/r2';

config({ path: '.env.local' });

const TEST_URL = 'https://pub-f0cb2c49a4434ad5a65e810e360b63f0.r2.dev/references/sister.jpg';
const PREFIX = 'test';

async function main() {
  console.log('=== R2 上传测试 ===');
  console.log('源图片:', TEST_URL);
  console.log('上传目录:', PREFIX);
  console.log('');

  console.log('=== 环境变量检查 ===');
  console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'undefined');
  console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? `${process.env.R2_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'undefined');
  console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT ? `${process.env.R2_ENDPOINT.substring(0, 40)}...` : 'undefined');
  console.log('R2_BUCKET:', process.env.R2_BUCKET);
  console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
  console.log('');

  try {
    const result = await uploadImageFromUrl(TEST_URL, PREFIX);
    console.log('');
    console.log('=== 测试成功 ===');
    console.log('R2 公开 URL:', result);
  } catch (error) {
    console.error('');
    console.error('=== 测试失败 ===');
    console.error(error);
    process.exit(1);
  }
}

main();
