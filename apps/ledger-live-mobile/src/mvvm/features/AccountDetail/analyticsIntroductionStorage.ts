import type { Dispatch } from "redux";
import {
  accountAnalyticsIntroductionPersistedSelector,
  recordAccountAnalyticsIntroductionEligibility,
  restoreAccountAnalyticsIntroduction,
  type AccountAnalyticsIntroductionState,
} from "@features/flow-account-detail-analytics-notice/state";
import { getAccountAnalyticsIntroductionState, saveAccountAnalyticsIntroductionState } from "~/db";

type AccountAnalyticsIntroductionStore = Readonly<{
  dispatch: Dispatch;
  getState: () => Readonly<{ accountAnalyticsIntroduction: AccountAnalyticsIntroductionState }>;
}>;

export async function restoreAccountAnalyticsIntroductionFromStorage(
  { dispatch, getState }: AccountAnalyticsIntroductionStore,
  hasOnboardedWithDevice: boolean,
): Promise<void> {
  try {
    dispatch(restoreAccountAnalyticsIntroduction(await getAccountAnalyticsIntroductionState()));
  } catch (error) {
    console.warn("Unable to restore the Analytics introduction dismissal", error);
    return;
  }
  const restoredState = getState().accountAnalyticsIntroduction;
  dispatch(recordAccountAnalyticsIntroductionEligibility(hasOnboardedWithDevice));
  const hasRecordedNewSnapshot = getState().accountAnalyticsIntroduction !== restoredState;
  if (hasRecordedNewSnapshot) {
    await saveAccountAnalyticsIntroductionSafely(
      accountAnalyticsIntroductionPersistedSelector(getState()),
    );
  }
}

export async function saveAccountAnalyticsIntroductionSafely(
  state: AccountAnalyticsIntroductionState,
): Promise<void> {
  try {
    await saveAccountAnalyticsIntroductionState(state);
  } catch (error) {
    console.warn("Unable to persist the Analytics introduction dismissal", error);
  }
}
