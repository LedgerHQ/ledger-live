export const copy = {
  analyticsIntroductionTitle: "Analytics card",
  dismissedStatus: "Dismissed — the card no longer shows on Account Detail.",
  visibleStatus:
    "Not dismissed — the card shows on eligible installs, on accounts with a confirmed operation.",
  eligibleStatus: "Eligible — this install was onboarded with a device before the update.",
  notEligibleStatus: "Not eligible — the card never shows on this install.",
  unrecordedEligibilityStatus: "Not recorded yet — eligibility is recorded on the next launch.",
  reset: "Reset",
} as const;

export const statusOf = (hasDismissed: boolean) =>
  hasDismissed ? copy.dismissedStatus : copy.visibleStatus;

export function eligibilityOf(isEligible: boolean | null): string {
  if (isEligible === null) return copy.unrecordedEligibilityStatus;
  return isEligible ? copy.eligibleStatus : copy.notEligibleStatus;
}
