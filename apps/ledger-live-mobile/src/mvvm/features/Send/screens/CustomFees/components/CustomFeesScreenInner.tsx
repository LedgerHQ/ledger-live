import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useStableGasOptions } from "@ledgerhq/live-common/flows/send/customFees/hooks/useStableGasOptions";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { useCustomFeesViewModel } from "../hooks/useCustomFeesViewModel";
import { CustomFeesScreenView } from "./CustomFeesScreenView";

type CustomFeesScreenInnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function CustomFeesScreenInner({
  account,
  parentAccount,
  transaction,
  status,
  transactionActions,
  onConfirm,
}: CustomFeesScreenInnerProps) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const stableTransaction = useStableGasOptions(transaction);

  useFlowEffects({
    account,
    parentAccount,
    transaction,
    currency,
    updateTransaction: transactionActions.updateTransaction,
  });

  const viewModel = useCustomFeesViewModel({
    account,
    parentAccount,
    transaction: stableTransaction,
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
