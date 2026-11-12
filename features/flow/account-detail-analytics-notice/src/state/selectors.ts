import type { AccountAnalyticsIntroductionState } from "./types";

type AccountAnalyticsIntroductionRoot = Readonly<{
  accountAnalyticsIntroduction: AccountAnalyticsIntroductionState;
}>;

export function selectAccountAnalyticsIntroductionDismissed(
  state: AccountAnalyticsIntroductionRoot,
): boolean {
  return state.accountAnalyticsIntroduction.hasDismissed;
}

export function selectAccountAnalyticsIntroductionEligible(
  state: AccountAnalyticsIntroductionRoot,
): boolean {
  return state.accountAnalyticsIntroduction.isEligible === true;
}

export function accountAnalyticsIntroductionPersistedSelector(
  state: AccountAnalyticsIntroductionRoot,
): AccountAnalyticsIntroductionState {
  const { hasDismissed, isEligible } = state.accountAnalyticsIntroduction;
  return { hasDismissed, isEligible };
}
