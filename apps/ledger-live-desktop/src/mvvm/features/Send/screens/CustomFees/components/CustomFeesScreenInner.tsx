import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  useStableGasOptions,
  useFlowEffects,
  type SendFlowTransactionActions,
} from "@features/platform-send-flow";
import { CustomFeesScreenInnerBase } from "./CustomFeesScreenInnerBase";

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

  const flowEffects = useFlowEffects({
    account,
    parentAccount,
    transaction,
    currency,
    updateTransaction: transactionActions.updateTransaction,
  });

  return (
    <CustomFeesScreenInnerBase
      account={account}
      parentAccount={parentAccount}
      transaction={stableTransaction}
      status={status}
      currency={currency}
      transactionActions={transactionActions}
      onConfirm={onConfirm}
      isFlowEffectLoading={flowEffects.loading}
    />
  );
}
