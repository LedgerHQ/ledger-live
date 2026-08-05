export const LEGACY_ONBOARDING_DATE = new Date("2026-01-01T00:00:00.000Z");

/** Fallback when onboardingDate is unknown (legacy users pre-field). Used by upsell cooldown. */
export function resolveOnboardingDateForUpsell(onboardingDate: Date | null): Date {
  return onboardingDate ?? LEGACY_ONBOARDING_DATE;
}
