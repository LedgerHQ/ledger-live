import React, { useEffect, useMemo } from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { AmountScreenInner } from "./components/AmountScreenInner";
import { useAmountScreen } from "./hooks/useAmountScreen";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowData } from "../../context/SendFlowContext";

export function AmountScreen() {
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account, parentAccount);
  }, [account, parentAccount]);

  useEffect(() => {
    track("send_modal", {
      ...trackingProperties,
      name: "step amount",
      flow: "send",
    });
  }, [track, trackingProperties]);

  const viewModel = useAmountScreen();
  if (!viewModel.ready) {
    return null;
  }

  return (
    <SendFlowLayout>
      <AmountScreenInner
        account={viewModel.account}
        parentAccount={viewModel.parentAccount}
        transaction={viewModel.transaction}
        status={viewModel.status}
        bridgePending={viewModel.bridgePending}
        bridgeError={viewModel.bridgeError}
        uiConfig={viewModel.uiConfig}
        transactionActions={viewModel.transactionActions}
        onReview={viewModel.onReview}
        onGetFunds={viewModel.onGetFunds}
        onSelectCoinControl={viewModel.onSelectCoinControl}
        onSelectCustomFees={viewModel.onSelectCustomFees}
      />
    </SendFlowLayout>
  );
}
