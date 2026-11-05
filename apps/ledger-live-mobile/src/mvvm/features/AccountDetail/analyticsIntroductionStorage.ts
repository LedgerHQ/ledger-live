import type { Dispatch } from "redux";
import {
  restoreAccountAnalyticsIntroduction,
  type AccountAnalyticsIntroductionState,
} from "@features/flow-account-detail-analytics-notice/state";
import { getAccountAnalyticsIntroductionState, saveAccountAnalyticsIntroductionState } from "~/db";

export async function restoreAccountAnalyticsIntroductionFromStorage(
  dispatch: Dispatch,
): Promise<void> {
  try {
    dispatch(restoreAccountAnalyticsIntroduction(await getAccountAnalyticsIntroductionState()));
  } catch (error) {
    console.warn("Unable to restore the Analytics introduction dismissal", error);
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
