import type { FearAndGreedLevel } from "../state-manager/types";

const MOOD_INDEX_RESTRICTED_REGIONS = new Set(["GB"]);

export function isMoodIndexAvailable(region: string | null | undefined): boolean {
  return !region || !MOOD_INDEX_RESTRICTED_REGIONS.has(region);
}

export const FEAR_AND_GREED_TRANSLATION_KEYS: Record<FearAndGreedLevel, string> = {
  fearPlus: "fearAndGreed.levels.fearPlus",
  fear: "fearAndGreed.levels.fear",
  neutral: "fearAndGreed.levels.neutral",
  greed: "fearAndGreed.levels.greed",
  greedPlus: "fearAndGreed.levels.greedPlus",
};

export const FEAR_AND_GREED_COLORS: Record<FearAndGreedLevel, string> = {
  fearPlus: "error",
  fear: "warning",
  neutral: "muted",
  greed: "success",
  greedPlus: "success",
};

export function getFearAndGreedLevel(value: number): FearAndGreedLevel {
  if (value <= 20) return "fearPlus";
  if (value <= 40) return "fear";
  if (value <= 60) return "neutral";
  if (value <= 80) return "greed";
  return "greedPlus";
}

export function getFearAndGreedTranslationKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_TRANSLATION_KEYS[level];
}

export function getFearAndGreedColorKey(value: number): string {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_COLORS[level];
}
