import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { isEvmTransaction } from "../../utils/isEvmTransaction";
import { useEvmGasOptions } from "../../hooks/useEvmGasOptions";
import { EvmGasOptionsSyncPluginEvm } from "./EvmGasOptionsSyncPluginEvm";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

export function EvmGasOptionsSyncPlugin({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props) {
  const evmTransaction = isEvmTransaction(transaction) ? transaction : null;

  // Hook must be called unconditionally — evmTransaction null-check is handled below.
  const [evmGasOptions, gasOptionsError, gasOptionsLoading] = useEvmGasOptions(
    account,
    parentAccount,
    // useEvmGasOptions is typed for EvmTransaction but the hook only reads currency/blockAvgTime
    // which exist on any transaction's mainAccount currency; safe to pass the generic transaction.
    transaction as Parameters<typeof useEvmGasOptions>[2],
  );

  if (!evmTransaction) return null;

  return (
    <EvmGasOptionsSyncPluginEvm
      account={account}
      parentAccount={parentAccount}
      transaction={evmTransaction}
      transactionActions={transactionActions}
      evmGasOptions={evmGasOptions}
      gasOptionsError={gasOptionsError}
      gasOptionsLoading={gasOptionsLoading}
    />
  );
}
