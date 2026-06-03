import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
import { AmountPluginsHost } from "./AmountPluginsHost";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";

type AmountScreenInnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onReview: () => void;
  onGetFunds: () => void;
  onSelectCoinControl: () => void;
}>;

export function AmountScreenInner({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError,
  uiConfig,
  transactionActions,
  onReview,
  onGetFunds,
  onSelectCoinControl,
}: AmountScreenInnerProps) {
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  const viewModel = useAmountScreenViewModel({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    bridgeError,
    uiConfig,
    transactionActions,
  });

  const handleReview = useCallback(() => {
    const activeQuickAction = viewModel.quickActions?.find(a => a.active)?.id ?? null;
    track("button_clicked", {
      button: "review",
      page: "step amount",
      quick_amount: activeQuickAction,
      fee_strategy: viewModel.selectedFeeStrategy ?? null,
      ...sendFlowTrackingProperties,
    });
    onReview();
  }, [onReview, viewModel.quickActions, viewModel.selectedFeeStrategy, sendFlowTrackingProperties]);

  return (
    <>
      <AmountPluginsHost
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        transactionActions={transactionActions}
      />
      <AmountScreenView
        {...viewModel}
        onReview={handleReview}
        onGetFunds={onGetFunds}
        onSelectCoinControl={onSelectCoinControl}
      />
    </>
  );
}
