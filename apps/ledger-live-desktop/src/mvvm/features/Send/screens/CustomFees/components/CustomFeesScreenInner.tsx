import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useCustomFeesViewModel } from "./hooks/useCustomFeesViewModel";
import { CustomFeesScreenView } from "./CustomFeesScreenView";

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
    />
  );
}
