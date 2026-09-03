import React, { useEffect, useMemo } from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { AmountScreenInner } from "./components/AmountScreenInner";
import { useAmountScreen } from "./hooks/useAmountScreen";
import { screen } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowData } from "../../context/SendFlowContext";
import { useSendFlowTracking } from "../../context/SendFlowTrackingContext";

export function AmountScreen() {
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { recipientType } = useSendFlowTracking();

  const trackingProperties = useMemo(
    () => ({
      ...getSendFlowTrackingProperties(account, parentAccount),
      recipientType,
    }),
    [account, parentAccount, recipientType],
  );

  useEffect(() => {
    void screen("Modal send - step amount", undefined, trackingProperties);
  }, [trackingProperties]);

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
