import React from "react";
import { AccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice";
import type { Account } from "@ledgerhq/types-live";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import { useAnalyticsIntroductionViewModel } from "./useAnalyticsIntroductionViewModel";

type Props = Readonly<{ account: Account }>;

export function AnalyticsIntroduction({ account }: Props) {
  return (
    <AccountAnalyticsIntroduction
      {...useAnalyticsIntroductionViewModel(account)}
      testID={ACCOUNT_DETAIL_TEST_IDS.analyticsIntroduction}
    />
  );
}
