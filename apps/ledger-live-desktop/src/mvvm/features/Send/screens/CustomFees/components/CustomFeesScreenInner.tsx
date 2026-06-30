import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useStableGasOptions } from "@ledgerhq/live-common/flows/send/customFees/hooks/useStableGasOptions";
import { isEvmGasOptionsSyncTransaction } from "../../../utils/isEvmTransaction";
import { CustomFeesScreenInnerBase } from "./CustomFeesScreenInnerBase";
import { CustomFeesScreenInnerWithAmountPlugins } from "./CustomFeesScreenInnerWithAmountPlugins";

type CustomFeesScreenInnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

const amountPluginTransactionGuards: Readonly<
  Record<string, (transaction: Transaction) => boolean>
> = {
  evmGasOptionsSync: isEvmGasOptionsSyncTransaction,
};

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
  const amountPlugins = useMemo(() => sendFeatures.getAmountPlugins(currency), [currency]);
  const evmTransaction = isEvmGasOptionsSyncTransaction(stableTransaction)
    ? stableTransaction
    : null;
  const hasSupportedAmountPlugin = amountPlugins.some(plugin =>
    amountPluginTransactionGuards[plugin]?.(stableTransaction),
  );

  if (!hasSupportedAmountPlugin || !evmTransaction) {
    return (
      <CustomFeesScreenInnerBase
        account={account}
        parentAccount={parentAccount}
        transaction={stableTransaction}
        status={status}
        currency={currency}
        transactionActions={transactionActions}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <CustomFeesScreenInnerWithAmountPlugins
      account={account}
      parentAccount={parentAccount}
      stableTransaction={stableTransaction}
      evmTransaction={evmTransaction}
      status={status}
      currency={currency}
      transactionActions={transactionActions}
      onConfirm={onConfirm}
    />
  );
}
