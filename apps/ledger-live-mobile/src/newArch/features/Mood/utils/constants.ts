import type { MoodData, MoodLevel } from "../types";

export const MOOD_LABELS: Record<MoodLevel, string> = {
  extremeFear: "Extreme Fear",
  fear: "Fear",
  neutral: "Neutral",
  greed: "Greed",
  extremeGreed: "Extreme Greed",
};

// Colors based on design tokens
// text-success = green, text-error = red, text-warning = orange
export const MOOD_COLORS: Record<MoodLevel, string> = {
  extremeFear: "#C24244", // text-error (red)
  fear: "#D38B20", // text-warning (orange)
  neutral: "#767676", // text-muted (grey)
  greed: "#47883A", // text-success (green)
  extremeGreed: "#47883A", // text-success (green)
};

export function getMoodLevel(value: number): MoodLevel {
  if (value <= 25) return "extremeFear";
  if (value <= 45) return "fear";
  if (value <= 55) return "neutral";
  if (value <= 75) return "greed";
  return "extremeGreed";
}

export function getMoodLabel(value: number): string {
  const level = getMoodLevel(value);
  return MOOD_LABELS[level];
}

export function getMoodColor(value: number): string {
  const level = getMoodLevel(value);
  return MOOD_COLORS[level];
}

// Mock data for each mood level
export const MOCK_MOOD_DATA: MoodData[] = [
  {
    value: 70,
    level: "greed",
    label: "Greedy",
  },
  {
    value: 15,
    level: "extremeFear",
    label: "Extreme Fear",
  },
  {
    value: 35,
    level: "fear",
    label: "Fear",
  },
  {
    value: 50,
    level: "neutral",
    label: "Neutral",
  },
  {
    value: 85,
    level: "extremeGreed",
    label: "Extreme Greed",
  },
];
