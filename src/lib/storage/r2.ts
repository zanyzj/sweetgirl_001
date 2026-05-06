import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

function createR2Client(): S3Client {
  console.log('[R2] endpoint:', process.env.R2_ENDPOINT);
  console.log('[R2] bucket:', process.env.R2_BUCKET);
  console.log('[R2] access key id length:', process.env.R2_ACCESS_KEY_ID?.length);
  console.log('[R2] secret key length:', process.env.R2_SECRET_ACCESS_KEY?.length);

  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = createR2Client();
  const bucket = process.env.R2_BUCKET!;

  console.log(`[R2] 开始上传到 R2, key: ${key}, 大小: ${(buffer.length / 1024).toFixed(2)} KB`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  console.log(`[R2] 上传完成, 公开 URL: ${publicUrl}`);

  return publicUrl;
}

async function uploadImageFromUrl(
  sourceUrl: string,
  prefix: string
): Promise<string> {
  console.log(`[R2] 开始下载源图: ${sourceUrl}`);

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`[R2] 下载失败, 状态码: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[R2] 下载完成, 大小: ${(buffer.length / 1024).toFixed(2)} KB, Content-Type: ${contentType}`);

  const key = `${prefix}/${nanoid()}.jpg`;
  const publicUrl = await uploadToR2(buffer, key, contentType);

  return publicUrl;
}

export { createR2Client, uploadToR2, uploadImageFromUrl };
