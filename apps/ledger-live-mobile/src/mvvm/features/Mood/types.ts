export type MoodLevel = "extremeFear" | "fear" | "neutral" | "greed" | "extremeGreed";

export interface MoodData {
  readonly value: number;
  readonly level: MoodLevel;
  readonly label: string;
}

export interface MoodCardProps {
  readonly data: MoodData;
  readonly onPress?: () => void;
}
