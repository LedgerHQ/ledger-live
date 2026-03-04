import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCustomFeesViewModel } from "../hooks/useCustomFeesViewModel";
import { CustomFeesScreenView } from "./CustomFeesScreenView";

export type CustomFeesScreenInnerBaseProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function CustomFeesScreenInnerBase({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
}: CustomFeesScreenInnerBaseProps) {
  const viewModel = useCustomFeesViewModel({
    account,
    parentAccount,
    transaction,
    status,
    currency,
    transactionActions,
    onConfirm,
  });

  return (
    <CustomFeesScreenView
      inputs={viewModel.inputs}
      fiatLabel={viewModel.fiatLabel}
      fiatValue={viewModel.fiatValue}
      isConfirmDisabled={viewModel.isConfirmDisabled}
      onInputChange={viewModel.onInputChange}
      onInputClear={viewModel.onInputClear}
      onConfirm={viewModel.onConfirm}
      hasCustomAssets={viewModel.hasCustomAssets}
      assetOptions={viewModel.assetOptions}
      selectedAssetId={viewModel.selectedAssetId}
      onAssetChange={viewModel.onAssetChange}
      confirmLabel={viewModel.confirmLabel}
      suggestedLabel={viewModel.suggestedLabel}
      payFeesInLabel={viewModel.payFeesInLabel}
    />
  );
}
