import { pickRandomPrompt } from './image-prompts';
import { uploadImageFromUrl } from '@/lib/storage/r2';

const SIMULATE_FAILURE = false; // 设置为 true 模拟失败

export async function generateCharacterImage(characterId: string): Promise<string | null> {
  if (SIMULATE_FAILURE) {
    console.log('[Image Gen] SIMULATING FAILURE for testing');
    throw new Error('Simulated failure for testing');
  }
  
  const prompt = pickRandomPrompt(characterId);
  
  const referenceImages: Record<string, string> = {
    sister: `${process.env.R2_PUBLIC_URL}/references/sister.jpg`,
    cute: `${process.env.R2_PUBLIC_URL}/references/cute.jpg`,
    cool: `${process.env.R2_PUBLIC_URL}/references/cool.jpg`,
    teacher: `${process.env.R2_PUBLIC_URL}/references/teacher.jpg`,
  };
  
  const referenceImage = referenceImages[characterId];

  console.log(`[Image Gen] start for character: ${characterId}, prompt: ${prompt}`);
  console.log(`[Image Gen] reference image URL: ${referenceImage}`);

  if (!referenceImage) {
    console.error(`[Image Gen] FAILED: No reference image found for ${characterId}`);
    return null;
  }

  const apiKey = process.env.VOLCENGINE_API_KEY;
  if (!apiKey) {
    console.error('[Image Gen] FAILED: VOLCENGINE_API_KEY not configured');
    return null;
  }

  const timeoutMs = 60000;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.log('[Image Gen] Timeout after', timeoutMs / 1000, 'seconds');
    controller.abort();
  }, timeoutMs);

  try {
    console.log('[Image Gen] Sending request to Volcengine...');
    const startTime = Date.now();
    
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-5-251128',
        prompt,
        image: referenceImage,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log('[Image Gen] Response received in', (Date.now() - startTime) / 1000, 'seconds');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Image Gen] FAILED: Volcengine API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const tempUrl = data.data?.[0]?.url;

    if (!tempUrl) {
      console.error('[Image Gen] FAILED: No URL in response');
      console.error('[Image Gen] Full response:', JSON.stringify(data));
      return null;
    }

    console.log(`[Image Gen] volcengine response received, temp url: ${tempUrl.substring(0, 50)}...`);

    const r2Url = await uploadImageFromUrl(tempUrl, `generated/${characterId}`);
    console.log(`[Image Gen] saved to R2: ${r2Url}`);

    return r2Url;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Image Gen] FAILED: Request timed out after ${timeoutMs / 1000} seconds`);
    } else {
      console.error(`[Image Gen] FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
}
