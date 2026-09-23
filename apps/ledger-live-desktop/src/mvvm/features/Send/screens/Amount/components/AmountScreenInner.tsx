import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
import { track } from "~/renderer/analytics/segment";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import { useSendFlowMessageTracking } from "../../../hooks/useSendFlowMessageTracking";
import { createTrackedMessage, getActiveWarningIds } from "../../../utils/messageTracking";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";

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
  const { flowSessionId } = useSendFlowTracking();
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  const flowEffects = useFlowEffects({
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
    onSelectCoinControl,
  });

  const messageTrackingRequest = useMemo(() => {
    const visibleMessageError = viewModel.amountMessage?.error;
    const hiddenAmountRequired =
      status.errors.amount?.name === "AmountRequired" ? status.errors.amount : null;
    const maxFeeWarning =
      status.warnings.maxFee?.name === "MaxFeeTooLow" ? status.warnings.maxFee : null;
    const primaryError =
      visibleMessageError ?? bridgeError ?? maxFeeWarning ?? hiddenAmountRequired;

    if (!primaryError) return null;

    const balance =
      getSelectedBalanceTypeBalance(account, transaction) ??
      account.spendableBalance ??
      account.balance;
    const amount = transaction.amount;
    const amountRatioToBalance =
      amount && balance?.gt(0) ? amount.dividedBy(balance).toNumber() : null;

    return {
      account,
      parentAccount,
      step: SEND_FLOW_STEP.AMOUNT,
      message: createTrackedMessage(
        primaryError,
        primaryError === maxFeeWarning ||
          (visibleMessageError && viewModel.amountMessage?.type !== "error")
          ? "warning"
          : "error",
        status,
        bridgeError ? [bridgeError.name] : [],
      ),
      metadata: { amountRatioToBalance },
    };
  }, [account, bridgeError, parentAccount, status, transaction, viewModel.amountMessage]);
  useSendFlowMessageTracking({
    step: SEND_FLOW_STEP.AMOUNT,
    request: messageTrackingRequest,
    isTransient: bridgePending || flowEffects.loading || viewModel.reviewLoading,
  });
  const activeWarningsTrackingProperties = useMemo(
    () => getActiveWarningsTrackingProperties(getActiveWarningIds(status)),
    [status],
  );

  const handleReview = useCallback(() => {
    const activeQuickAction = viewModel.quickActions?.find(a => a.active)?.id ?? null;
    track("button_clicked", {
      button: "review",
      page: "step amount",
      quick_amount: activeQuickAction,
      fee_strategy: viewModel.selectedFeeStrategy ?? null,
      input_mode: viewModel.inputMode,
      flow_session_id: flowSessionId,
      ...activeWarningsTrackingProperties,
      ...sendFlowTrackingProperties,
    });
    onReview();
  }, [
    onReview,
    viewModel.quickActions,
    viewModel.selectedFeeStrategy,
    viewModel.inputMode,
    activeWarningsTrackingProperties,
    flowSessionId,
    sendFlowTrackingProperties,
  ]);

  return (
    <AmountScreenView
      {...viewModel}
      onReview={handleReview}
      onGetFunds={onGetFunds}
      onMessageLinkPress={onMessageLinkPress}
    />
  );
}
