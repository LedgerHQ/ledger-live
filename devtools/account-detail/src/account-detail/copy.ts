export const copy = {
  analyticsIntroductionTitle: "Analytics card",
  dismissedStatus: "Dismissed — the card no longer shows on Account Detail.",
  visibleStatus:
    "Not dismissed — the card shows on eligible installs, on accounts with a confirmed operation.",
  eligibleStatus: "Eligible — this install was onboarded with a device before the update.",
  notEligibleStatus: "Not eligible — the card never shows on this install.",
  unrecordedEligibilityStatus: "Not recorded yet — eligibility is recorded on the next launch.",
  reset: "Reset",
  eligibilityControlLabel: "Eligibility",
} as const;

export type EligibilityOption = "eligible" | "notEligible" | "unrecorded";

export const ELIGIBILITY_OPTIONS: ReadonlyArray<{ value: EligibilityOption; label: string }> = [
  { value: "eligible", label: "Eligible" },
  { value: "notEligible", label: "Not eligible" },
  { value: "unrecorded", label: "Not recorded" },
];

export function eligibilityOptionOf(isEligible: boolean | null): EligibilityOption {
  if (isEligible === null) return "unrecorded";
  return isEligible ? "eligible" : "notEligible";
}

export function eligibilityFromOption(option: string): boolean | null {
  if (option === "eligible") return true;
  if (option === "notEligible") return false;
  return null;
}

export const statusOf = (hasDismissed: boolean) =>
  hasDismissed ? copy.dismissedStatus : copy.visibleStatus;

export function eligibilityOf(isEligible: boolean | null): string {
  if (isEligible === null) return copy.unrecordedEligibilityStatus;
  return isEligible ? copy.eligibleStatus : copy.notEligibleStatus;
}
