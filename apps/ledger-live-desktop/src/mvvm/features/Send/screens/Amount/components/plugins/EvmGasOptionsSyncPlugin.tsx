import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { isEvmTransaction } from "../../utils/isEvmTransaction";
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
  if (!isEvmTransaction(transaction)) return null;

  return (
    <EvmGasOptionsSyncPluginEvm
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
    />
  );
}
