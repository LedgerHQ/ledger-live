import React from "react";
import { RefreshStatusView } from "LLM/components/RefreshStatus";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import { useAccountRefreshStatusViewModel } from "./useAccountRefreshStatusViewModel";

type Props = Parameters<typeof useAccountRefreshStatusViewModel>[0];

export function AccountRefreshStatus(props: Props) {
  return (
    <RefreshStatusView
      {...useAccountRefreshStatusViewModel(props)}
      testID={ACCOUNT_DETAIL_TEST_IDS.refreshStatus}
    />
  );
}
