import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "../../../../types";
import { isEvmTransaction } from "../../utils/isEvmTransaction";
import { EvmGasOptionsSync } from "../Fees/EvmGasOptionsSync";

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
  if (!isEvmTransaction(transaction)) {
    return null;
  }

  return (
    <EvmGasOptionsSync
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
    />
  );
}
