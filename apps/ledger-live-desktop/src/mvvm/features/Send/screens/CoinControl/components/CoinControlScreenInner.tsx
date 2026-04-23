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
  onSelectCustomFees: () => void;
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
    bridgeError,
    uiConfig,
    transactionActions,
  });

  const onAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      viewModel.onAmountChange(event.currentTarget.value);
    },
    [viewModel],
  );

  return (
    <>
      <CoinControlScreenView
        utxoDisplayData={viewModel.utxoDisplayData}
        strategyOptionsWithLabels={viewModel.strategyOptionsWithLabels}
        changeToReturn={viewModel.changeToReturn}
        onSelectStrategy={viewModel.onSelectStrategy}
        amountValue={viewModel.amountValue}
        onAmountChange={onAmountChange}
        amountError={viewModel.amountError}
        strategyLabel={viewModel.strategyLabel}
        learnMoreLabel={viewModel.learnMoreLabel}
        onLearnMoreClick={viewModel.onLearnMoreClick}
        coinToSendLabel={viewModel.coinToSendLabel}
        amountToSendLabel={viewModel.amountToSendLabel}
        amountInputLabel={viewModel.amountInputLabel}
        networkFees={viewModel.networkFees}
        reviewLabel={viewModel.reviewLabel}
        reviewShowIcon={viewModel.reviewShowIcon}
        reviewDisabled={viewModel.reviewDisabled}
        reviewLoading={viewModel.reviewLoading}
        onReview={handleReview}
        onGetFunds={onGetFunds}
        isCustomPickingStrategy={viewModel.isCustomPickingStrategy}
        onToggleUtxoExclusion={viewModel.onToggleUtxoExclusion}
        onSelectCustomFees={onSelectCustomFees}
      />
    </>
  );
}
