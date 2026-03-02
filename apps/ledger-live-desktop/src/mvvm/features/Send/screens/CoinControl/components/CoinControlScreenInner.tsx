import React, { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useCoinControlScreenViewModel } from "../hooks/useCoinControlScreenViewModel";
import { CoinControlScreenView } from "./CoinControlScreenView";

type CoinControlScreenInnerProps = Readonly<{
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
}>;

export function CoinControlScreenInner({
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
    bridgeError,
    uiConfig,
    transactionActions,
  });

  return (
    <>
      <CoinControlScreenView
        utxoDisplayData={viewModel.utxoDisplayData}
        onSelectStrategy={viewModel.onSelectStrategy}
        amountValue={viewModel.amountValue}
        onAmountChange={viewModel.onAmountChange}
        feesRowLabel={viewModel.feesRowLabel}
        feesRowValue={viewModel.feesRowValue}
        feesRowStrategyLabel={viewModel.feesRowStrategyLabel}
        selectedFeeStrategy={viewModel.selectedFeeStrategy}
        feePresetOptions={viewModel.feePresetOptions}
        fiatByPreset={viewModel.fiatByPreset}
        legendByPreset={viewModel.legendByPreset}
        onSelectFeeStrategy={viewModel.onSelectFeeStrategy}
        reviewLabel={viewModel.reviewLabel}
        reviewShowIcon={viewModel.reviewShowIcon}
        reviewDisabled={viewModel.reviewDisabled}
        reviewLoading={viewModel.reviewLoading}
        onReview={handleReview}
        onGetFunds={onGetFunds}
      />
    </>
  );
}
