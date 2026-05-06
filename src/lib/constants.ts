import { OpenAI } from 'openai';

export const deepseek = process.env.DEEPSEEK_API_KEY ? new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
}) : null;

export const STAGES = {
  stranger: { min: 0, max: 20, name: '陌生' },
  acquaintance: { min: 21, max: 40, name: '认识' },
  friend: { min: 41, max: 60, name: '朋友' },
  intimate: { min: 61, max: 85, name: '暧昧' },
  lover: { min: 86, max: 100, name: '恋人' },
} as const;

export type Stage = keyof typeof STAGES;

export function getStageFromAffection(affection: number): Stage {
  if (affection >= 86) return 'lover';
  if (affection >= 61) return 'intimate';
  if (affection >= 41) return 'friend';
  if (affection >= 21) return 'acquaintance';
  return 'stranger';
}

export function getStageName(stage: Stage): string {
  return STAGES[stage].name;
}

export const IMAGE_PROBABILITY: Record<Stage, number> = {
  stranger: 0,
  acquaintance: 0.05,
  friend: 0.15,
  intimate: 1.0,  // 临时设为100%测试
  lover: 1.0,     // 临时设为100%测试
};

export const MAX_DAILY_IMAGES = 3;
export const MAX_DAILY_IMAGES_PER_CHARACTER = 3;
export const MAX_DAILY_ADDITION = 50;
export const MAX_DAILY_DEDUCTION = 30;

export const BASE_AFFECTION_PER_MESSAGE = 2;
export const EMOTIONAL_POSITIVE_BONUS = 3;
export const SHARE_INFO_BONUS = 5;
export const CONSECUTIVE_DAY_BONUS = 5;

export const NO_CHAT_24H_PENALTY = -3;
export const NO_CHAT_72H_EXTRA_PENALTY = -10;
export const COLD_RESPOND_PENALTY = -2;
export const RUDE_PENALTY = -10;
export const MENTION_OTHER_CHARACTER_PENALTY = -5;
