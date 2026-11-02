import React from "react";
import { AccountAnalyticsIntroduction } from "@features/flow-account-detail/web";
import type { Account } from "@ledgerhq/types-live";
import { useAnalyticsIntroductionViewModel } from "./useAnalyticsIntroductionViewModel";

type Props = Readonly<{ account: Account }>;

export function AnalyticsIntroduction({ account }: Props) {
  return (
    <AccountAnalyticsIntroduction
      {...useAnalyticsIntroductionViewModel(account)}
      testID="account-analytics-introduction"
    />
  );
}
