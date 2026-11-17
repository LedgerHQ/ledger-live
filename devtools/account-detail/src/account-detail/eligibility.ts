export type EligibilityOption = "eligible" | "notEligible" | "unrecorded";

const ELIGIBILITY_BY_OPTION: Readonly<Record<EligibilityOption, boolean | null>> = {
  eligible: true,
  notEligible: false,
  unrecorded: null,
};

const ELIGIBILITY_OPTION_VALUES: ReadonlySet<string> = new Set(Object.keys(ELIGIBILITY_BY_OPTION));

function isEligibilityOption(value: string): value is EligibilityOption {
  return ELIGIBILITY_OPTION_VALUES.has(value);
}

export function eligibilityOptionOf(isEligible: boolean | null): EligibilityOption {
  if (isEligible === null) return "unrecorded";
  return isEligible ? "eligible" : "notEligible";
}

export function selectEligibilityOption(
  value: string,
  onEligibilityChange: (isEligible: boolean | null) => void,
): void {
  if (!isEligibilityOption(value)) return;
  onEligibilityChange(ELIGIBILITY_BY_OPTION[value]);
}
