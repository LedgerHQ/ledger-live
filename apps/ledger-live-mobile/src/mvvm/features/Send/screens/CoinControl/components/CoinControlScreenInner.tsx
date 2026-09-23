import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCoinControlScreenViewModel } from "../hooks/useCoinControlScreenViewModel";
import { CoinControlScreenView } from "./CoinControlScreenView";
import { useSendFlowMessageTracking } from "../../../hooks/useSendFlowMessageTracking";
import { createTrackedMessage } from "../../../utils/messageTracking";

type CoinControlScreenInnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onReview: () => void;
  onGetFunds: () => void;
  onSelectCustomFees: () => void;
}>;

export function CoinControlScreenInner({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  uiConfig,
  transactionActions,
  onReview,
  onGetFunds,
  onSelectCustomFees,
}: CoinControlScreenInnerProps) {
  const handleReview = useCallback(() => {
    onReview();
  }, [onReview]);

  const viewModel = useCoinControlScreenViewModel({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    uiConfig,
    transactionActions,
    onSelectCustomFees,
  });

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const messageTrackingRequest = useMemo(() => {
    const primaryError = status.errors.amount ?? status.errors.dustLimit;
    if (!primaryError) return null;

    const balance = mainAccount.spendableBalance ?? mainAccount.balance;
    const amountRatioToBalance =
      transaction.amount && balance?.gt(0)
        ? transaction.amount.dividedBy(balance).toNumber()
        : null;

    return {
      account,
      parentAccount,
      step: SEND_FLOW_STEP.COIN_CONTROL,
      message: createTrackedMessage(primaryError, "error", status),
      metadata: { amountRatioToBalance },
    };
  }, [account, mainAccount, parentAccount, status, transaction.amount]);
  useSendFlowMessageTracking({
    step: SEND_FLOW_STEP.COIN_CONTROL,
    request: messageTrackingRequest,
    isTransient: bridgePending || viewModel.reviewLoading,
  });

  return (
    <CoinControlScreenView
      utxoDisplayData={viewModel.utxoDisplayData}
      strategyOptionsWithLabels={viewModel.strategyOptionsWithLabels}
      changeToReturn={viewModel.changeToReturn}
      onSelectStrategy={viewModel.onSelectStrategy}
      amountValue={viewModel.amountValue}
      onAmountChange={viewModel.onAmountChange}
      amountError={viewModel.amountError}
      strategyLabel={viewModel.coinControlStrategyLabel}
      onInfoPress={viewModel.onInfoPress}
      coinToSendLabel={viewModel.coinToSendLabel}
      amountToSendLabel={viewModel.amountToSendLabel}
      networkFees={viewModel.networkFees}
      reviewLabel={viewModel.reviewLabel}
      reviewShowIcon={viewModel.reviewShowIcon}
      reviewDisabled={viewModel.reviewDisabled}
      reviewLoading={viewModel.reviewLoading}
      onReview={handleReview}
      onGetFunds={onGetFunds}
      isCustomPickingStrategy={viewModel.isCustomPickingStrategy}
      onToggleUtxoExclusion={viewModel.onToggleUtxoExclusion}
      hasAmount={viewModel.hasAmount}
    />
  );
}
