import type { FearAndGreedLevel } from "../state-manager/types";

export const FEAR_AND_GREED_TRANSLATION_KEYS: Record<FearAndGreedLevel, string> = {
  fear: "fearAndGreed.levels.fear",
  cautious: "fearAndGreed.levels.cautious",
  neutral: "fearAndGreed.levels.neutral",
  optimistic: "fearAndGreed.levels.optimistic",
  greedy: "fearAndGreed.levels.greedy",
};

export const FEAR_AND_GREED_COLORS: Record<FearAndGreedLevel, string> = {
  fear: "error",
  cautious: "warning",
  neutral: "muted",
  optimistic: "success",
  greedy: "success",
};

export function getFearAndGreedLevel(value: number): FearAndGreedLevel {
  if (value <= 20) return "fear";
  if (value <= 40) return "cautious";
  if (value <= 60) return "neutral";
  if (value <= 80) return "optimistic";
  return "greedy";
}

export function getFearAndGreedTranslationKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_TRANSLATION_KEYS[level];
}

export function getFearAndGreedColorKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_COLORS[level];
}
