const MS_PER_DAY = 86_400_000;

type DisplayParamValue = string | number | boolean | null | undefined;

/** Noon UTC N calendar days ago. Stable QA presets (matches canvas / FF cooldown demos). */
export function daysAgoDate(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

export function daysAgoIso(days: number): string {
  return daysAgoDate(days).toISOString();
}

/** cooldownDays 0 → today (already elapsed). */
export function pastCooldownOffsetDays(cooldownDays: number): number {
  return Math.max(0, cooldownDays);
}

// No "Today" preset: Clear/legacy already means today.
export const ONBOARDING_DATE_PRESETS = [
  { id: "sevenDaysAgo", days: 7, labelKey: "onboardingSevenDaysAgo" },
] as const;

function displayParamValue(value: DisplayParamValue): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "on" : "off";
  return String(value);
}

export function resolveParamBaseline<T extends DisplayParamValue>({
  effective,
  schemaDefault,
  hasLocalOverride,
}: {
  effective: T;
  schemaDefault: T;
  hasLocalOverride: boolean;
}): { baseline: string; baselineValue: T; isOverridden: boolean } {
  const defStr = displayParamValue(schemaDefault);
  const effStr = displayParamValue(effective);

  const useRemote = !hasLocalOverride && effStr !== "-" && effStr !== defStr;
  const baselineValue = (useRemote ? effective : schemaDefault) as T;
  const baseline = useRemote ? effStr : defStr;

  return {
    baseline,
    baselineValue,
    isOverridden: hasLocalOverride && effStr !== "-" && effStr !== baseline,
  };
}

export function draftDisplayFromEffective(effective: DisplayParamValue, baseline: string): string {
  const effStr = displayParamValue(effective);
  if (effStr === "-" || effStr === baseline) return "";
  return effStr;
}

export function parseNonNegativeInteger(value: string): number | undefined {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  return trimmed !== "" && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Local calendar days; matches flow isCooldownElapsed. */
export function calendarDaysBetween(later: Date, earlier: Date): number {
  const startOfLocalDayUtc = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((startOfLocalDayUtc(later) - startOfLocalDayUtc(earlier)) / MS_PER_DAY);
}

/**
 * Mirrors getLargeScreenUpsellDecision: null onboardingDate is treated as `now`
 * (legacy installs wait the full cooldown unless cooldownDays is 0).
 */
export function isPostOnboardingCooldownPassed({
  onboardingDate,
  cooldownDays,
  now,
}: {
  onboardingDate: Date | null;
  cooldownDays: number;
  now: Date;
}): boolean {
  const elapsedSinceDate = onboardingDate ?? now;
  return calendarDaysBetween(now, elapsedSinceDate) >= cooldownDays;
}

export type UpsellGateReason =
  | "feature_disabled"
  | "modal_disabled"
  | "touchscreen_seen"
  | "no_nano"
  | "model_disabled"
  | "cooldown"
  | "throttled";

export type UpsellGateRow = {
  reason: UpsellGateReason;
  passes: boolean;
  isBlocking: boolean;
};

type UpsellGateCandidateRow = {
  reason: UpsellGateReason;
  passes: boolean;
};

/** High retries alone do not fail this gate when lastSeenAt is null. */
export function isThrottleGatePassed({
  retries,
  lastSeenAt,
  killThreshold,
  cadenceDays,
  now,
}: {
  retries: number;
  lastSeenAt: number | null;
  killThreshold: number;
  cadenceDays: number;
  now: Date;
}): boolean {
  if (retries < killThreshold || lastSeenAt === null) return true;

  return isPostOnboardingCooldownPassed({
    onboardingDate: new Date(lastSeenAt),
    cooldownDays: cadenceDays,
    now,
  });
}

export function buildUpsellGateRows(input: {
  isFeatureEnabled: boolean;
  isModalEnabled: boolean;
  hasSeenTouchscreenDevice: boolean;
  hasNano: boolean;
  isModelInAudience: boolean;
  cooldownPassed: boolean;
  throttlePassed: boolean;
  blockingReason?: UpsellGateReason;
}): UpsellGateRow[] {
  const rows: UpsellGateCandidateRow[] = [
    { reason: "feature_disabled", passes: input.isFeatureEnabled },
    { reason: "modal_disabled", passes: input.isModalEnabled },
    { reason: "touchscreen_seen", passes: !input.hasSeenTouchscreenDevice },
    { reason: "no_nano", passes: input.hasNano },
    { reason: "model_disabled", passes: input.isModelInAudience },
    { reason: "cooldown", passes: input.cooldownPassed },
    { reason: "throttled", passes: input.throttlePassed },
  ];

  return rows.map(row => ({
    ...row,
    isBlocking: input.blockingReason === row.reason,
  }));
}
