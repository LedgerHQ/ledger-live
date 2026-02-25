import type { FearAndGreedLevel } from "../state-manager/types";

export const FEAR_AND_GREED_TRANSLATION_KEYS: Record<FearAndGreedLevel, string> = {
  extremeFear: "fearAndGreed.levels.extremeFear",
  fear: "fearAndGreed.levels.fear",
  neutral: "fearAndGreed.levels.neutral",
  greed: "fearAndGreed.levels.greed",
  extremeGreed: "fearAndGreed.levels.extremeGreed",
};

export const FEAR_AND_GREED_COLORS: Record<FearAndGreedLevel, string> = {
  extremeFear: "error",
  fear: "warning",
  neutral: "muted",
  greed: "success",
  extremeGreed: "success",
};

export function getFearAndGreedLevel(value: number): FearAndGreedLevel {
  if (value <= 25) return "extremeFear";
  if (value <= 45) return "fear";
  if (value <= 55) return "neutral";
  if (value <= 75) return "greed";
  return "extremeGreed";
}

export function getFearAndGreedTranslationKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_TRANSLATION_KEYS[level];
}

export function getFearAndGreedColorKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_COLORS[level];
}
