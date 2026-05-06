import { generateCharacterImage } from './image-generator';

export interface PickImageParams {
  characterId: string;
}

export async function pickImage({ characterId }: PickImageParams): Promise<string> {
  const generatedUrl = await generateCharacterImage(characterId);
  
  if (generatedUrl) {
    return generatedUrl;
  }
  
  console.warn(`[image-picker] generation failed for ${characterId}, falling back to avatar`);
  return `/characters/${characterId}/avatar.jpg`;
}
