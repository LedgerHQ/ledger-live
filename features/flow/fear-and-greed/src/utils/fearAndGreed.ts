export type FearAndGreedLevel = "fearPlus" | "fear" | "neutral" | "greed" | "greedPlus";

const MOOD_INDEX_RESTRICTED_REGIONS = new Set(["GB"]);

export function isMoodIndexAvailable(region: string | null | undefined): boolean {
  return !region || !MOOD_INDEX_RESTRICTED_REGIONS.has(region);
}

export const FEAR_AND_GREED_TRANSLATION_KEYS = {
  fearPlus: "fearAndGreed.levels.fearPlus",
  fear: "fearAndGreed.levels.fear",
  neutral: "fearAndGreed.levels.neutral",
  greed: "fearAndGreed.levels.greed",
  greedPlus: "fearAndGreed.levels.greedPlus",
} as const satisfies Record<FearAndGreedLevel, string>;

export type FearAndGreedTranslationKey =
  (typeof FEAR_AND_GREED_TRANSLATION_KEYS)[FearAndGreedLevel];

export const FEAR_AND_GREED_COLORS = {
  fearPlus: "error",
  fear: "warning",
  neutral: "muted",
  greed: "success",
  greedPlus: "success",
} as const satisfies Record<FearAndGreedLevel, "error" | "warning" | "muted" | "success">;

export type FearAndGreedColorKey = (typeof FEAR_AND_GREED_COLORS)[FearAndGreedLevel];

export function getFearAndGreedLevel(value: number): FearAndGreedLevel {
  if (value <= 20) return "fearPlus";
  if (value <= 40) return "fear";
  if (value <= 60) return "neutral";
  if (value <= 80) return "greed";
  return "greedPlus";
}

export function getFearAndGreedTranslationKey(value: number): FearAndGreedTranslationKey {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_TRANSLATION_KEYS[level];
}

export function getFearAndGreedColorKey(value: number): FearAndGreedColorKey {
  const level = getFearAndGreedLevel(value);
  return FEAR_AND_GREED_COLORS[level];
}
