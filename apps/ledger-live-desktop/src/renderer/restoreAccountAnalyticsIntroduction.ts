import { restoreAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice/state";
import { log } from "@ledgerhq/logs";
import type { Dispatch } from "@reduxjs/toolkit";
import { getKey } from "./storage";

export async function restoreAccountAnalyticsIntroductionFromStorage(dispatch: Dispatch) {
  try {
    dispatch(
      restoreAccountAnalyticsIntroduction(await getKey("app", "accountAnalyticsIntroduction")),
    );
  } catch {
    log("account-detail", "Unable to restore Analytics introduction dismissal");
  }
}
