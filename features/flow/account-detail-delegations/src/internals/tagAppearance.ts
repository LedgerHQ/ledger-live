import type { DelegationStatusAppearance } from "../components/AccountDelegations/AccountDelegations.types";

export const TAG_APPEARANCE = {
  success: "success",
  warning: "warning",
  error: "error",
  neutral: "gray",
} as const satisfies Record<DelegationStatusAppearance, string>;
