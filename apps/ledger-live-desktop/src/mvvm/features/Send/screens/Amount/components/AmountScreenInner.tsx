import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
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
  onMessageLinkPress: (link: string) => void;
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
  onMessageLinkPress,
}: AmountScreenInnerProps) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  useFlowEffects({
    account,
    parentAccount,
    transaction,
    currency,
    updateTransaction: transactionActions.updateTransaction,
  });

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
      amount: viewModel.amountUsd,
      input_mode: viewModel.inputMode,
      ...sendFlowTrackingProperties,
    });
    onReview();
  }, [
    onReview,
    viewModel.quickActions,
    viewModel.selectedFeeStrategy,
    viewModel.amountUsd,
    viewModel.inputMode,
    sendFlowTrackingProperties,
  ]);

  return (
    <AmountScreenView
      {...viewModel}
      onReview={handleReview}
      onGetFunds={onGetFunds}
      onSelectCoinControl={onSelectCoinControl}
      onMessageLinkPress={onMessageLinkPress}
    />
  );
}
