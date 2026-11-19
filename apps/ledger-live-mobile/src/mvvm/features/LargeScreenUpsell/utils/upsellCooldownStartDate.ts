import { resolveOnboardingDateForUpsell } from "@ledgerhq/live-common/postOnboarding/logic/legacyOnboardingDate";

export function resolveUpsellCooldownStartDate(
  onboardingDate: Date | null,
  onboardingCompletionDate: string | null,
): Date {
  const postOnboardingStartDate = resolveOnboardingDateForUpsell(onboardingDate);
  const deviceSetupDate = onboardingCompletionDate ? new Date(onboardingCompletionDate) : null;

  if (!deviceSetupDate || Number.isNaN(deviceSetupDate.getTime())) {
    return postOnboardingStartDate;
  }

  return deviceSetupDate > postOnboardingStartDate ? deviceSetupDate : postOnboardingStartDate;
}
