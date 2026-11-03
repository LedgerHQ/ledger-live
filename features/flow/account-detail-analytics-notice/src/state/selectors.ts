import type { AccountAnalyticsIntroductionState } from "./types";

type AccountAnalyticsIntroductionRoot = Readonly<{
  accountAnalyticsIntroduction: AccountAnalyticsIntroductionState;
}>;

export function selectAccountAnalyticsIntroductionDismissed(
  state: AccountAnalyticsIntroductionRoot,
): boolean {
  return state.accountAnalyticsIntroduction.hasDismissed;
}

export function accountAnalyticsIntroductionPersistedSelector(
  state: AccountAnalyticsIntroductionRoot,
): AccountAnalyticsIntroductionState {
  return { hasDismissed: state.accountAnalyticsIntroduction.hasDismissed };
}
