export const LEGACY_ONBOARDING_DATE = new Date("2026-01-01T00:00:00.000Z");

function isKnownOnboardingDate(onboardingDate: Date): boolean {
  return !Number.isNaN(onboardingDate.getTime());
}

/** Fallback when onboardingDate is unknown (legacy users pre-field). Used by upsell cooldown. */
export function resolveOnboardingDateForUpsell(onboardingDate: Date | null): Date {
  if (onboardingDate != null && isKnownOnboardingDate(onboardingDate)) {
    return onboardingDate;
  }

  return new Date(LEGACY_ONBOARDING_DATE);
}
