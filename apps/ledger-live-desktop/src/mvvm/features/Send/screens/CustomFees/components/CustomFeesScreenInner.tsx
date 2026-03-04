import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useEvmGasOptions } from "../../Amount/hooks/useEvmGasOptions";
import { EvmGasOptionsSyncPluginEvm } from "../../Amount/components/plugins/EvmGasOptionsSyncPluginEvm";
import { useCustomFeesViewModel } from "../hooks/useCustomFeesViewModel";
import { CustomFeesScreenView } from "./CustomFeesScreenView";
import { useStableGasOptions } from "../hooks/useStableGasOptions";

type CustomFeesScreenInnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
  onBack: () => void;
}>;

export function CustomFeesScreenInner({
  account,
  parentAccount,
  transaction,
  status,
  transactionActions,
  onConfirm,
  onBack,
}: CustomFeesScreenInnerProps) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const stableTransaction = useStableGasOptions(transaction);

  const evmTransaction =
    stableTransaction.family === "evm" ? (stableTransaction as unknown as EvmTransaction) : null;
  if (!evmTransaction) {
    return (
      <CustomFeesScreenInnerContent
        account={account}
        parentAccount={parentAccount}
        transaction={stableTransaction}
        status={status}
        currency={currency}
        transactionActions={transactionActions}
        onConfirm={onConfirm}
        onBack={onBack}
      />
    );
  }

  return (
    <CustomFeesScreenInnerEvm
      account={account}
      parentAccount={parentAccount}
      stableTransaction={stableTransaction}
      evmTransaction={evmTransaction}
      status={status}
      currency={currency}
      transactionActions={transactionActions}
      onConfirm={onConfirm}
      onBack={onBack}
    />
  );
}

type CustomFeesScreenInnerContentProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: ReturnType<typeof getAccountCurrency>;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
  onBack: () => void;
}>;

function CustomFeesScreenInnerContent({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
  onBack,
}: CustomFeesScreenInnerContentProps) {
  const viewModel = useCustomFeesViewModel({
    account,
    parentAccount,
    transaction,
    status,
    currency,
    transactionActions,
    onConfirm,
    onBack,
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

type CustomFeesScreenInnerEvmProps = Omit<CustomFeesScreenInnerContentProps, "transaction"> & {
  stableTransaction: Transaction;
  evmTransaction: EvmTransaction;
};

function CustomFeesScreenInnerEvm({
  account,
  parentAccount,
  stableTransaction,
  evmTransaction,
  status,
  currency,
  transactionActions,
  onConfirm,
  onBack,
}: CustomFeesScreenInnerEvmProps) {
  const [evmGasOptions, gasOptionsError, gasOptionsLoading] = useEvmGasOptions(
    account,
    parentAccount,
    evmTransaction,
  );

  const transactionForViewModel = useMemo(() => {
    if ("gasOptions" in stableTransaction && stableTransaction.gasOptions) {
      return stableTransaction;
    }
    if (evmGasOptions) {
      return { ...stableTransaction, gasOptions: evmGasOptions } as Transaction;
    }
    return stableTransaction;
  }, [stableTransaction, evmGasOptions]);

  return (
    <>
      <EvmGasOptionsSyncPluginEvm
        account={account}
        parentAccount={parentAccount}
        transaction={evmTransaction}
        transactionActions={transactionActions}
        evmGasOptions={evmGasOptions}
        gasOptionsError={gasOptionsError}
        gasOptionsLoading={gasOptionsLoading}
      />
      <CustomFeesScreenInnerContent
        account={account}
        parentAccount={parentAccount}
        transaction={transactionForViewModel}
        status={status}
        currency={currency}
        transactionActions={transactionActions}
        onConfirm={onConfirm}
        onBack={onBack}
      />
    </>
  );
}
