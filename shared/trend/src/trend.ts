export type TrendTone = "positive" | "negative" | "neutral";

export type TrendSign = "+" | "-" | "";

type ZeroSign = Extract<TrendSign, "+" | "">;

export type TrendToneOptions = {
  readonly decimals?: number;
};

export type TrendSignOptions = TrendToneOptions & {
  readonly zeroSign?: ZeroSign;
};

export type TrendPercentOptions = {
  readonly decimals?: number | null;
  readonly zeroSign?: ZeroSign;
};

const DEFAULT_PERCENT_DECIMALS = 2;

function roundTo(value: number, decimals: number | undefined): number {
  return decimals === undefined ? value : Number.parseFloat(value.toFixed(decimals));
}

export function getTrendTone(
  value: number | null | undefined,
  { decimals }: TrendToneOptions = {},
): TrendTone {
  if (value == null || Number.isNaN(value)) return "neutral";
  const comparedValue = roundTo(value, decimals);
  if (comparedValue > 0) return "positive";
  if (comparedValue < 0) return "negative";
  return "neutral";
}

export function getTrendSign(
  value: number,
  { decimals, zeroSign = "" }: TrendSignOptions = {},
): TrendSign {
  const comparedValue = roundTo(value, decimals);
  if (comparedValue > 0) return "+";
  if (comparedValue < 0) return "-";
  return zeroSign;
}

export function formatTrendPercent(
  percent: number,
  { decimals = DEFAULT_PERCENT_DECIMALS, zeroSign = "" }: TrendPercentOptions = {},
): string {
  const magnitude = Math.abs(percent);
  const digits = decimals === null ? String(magnitude) : magnitude.toFixed(decimals);
  return `${getTrendSign(percent, { zeroSign })}${digits}%`;
}
