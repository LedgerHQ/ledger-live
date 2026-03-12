import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { isEvmTransaction } from "../../../../utils/isEvmTransaction";
import { useEvmGasOptions } from "../../hooks/useEvmGasOptions";
import { EvmGasOptionsSyncPluginEvm } from "./EvmGasOptionsSyncPluginEvm";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

type InnerProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: EvmTransaction;
  transactionActions: SendFlowTransactionActions;
}>;

function EvmGasOptionsSyncPluginInner({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: InnerProps) {
  const [evmGasOptions, gasOptionsError, gasOptionsLoading] = useEvmGasOptions(
    account,
    parentAccount,
    transaction,
  );

  return (
    <EvmGasOptionsSyncPluginEvm
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
      evmGasOptions={evmGasOptions}
      gasOptionsError={gasOptionsError}
      gasOptionsLoading={gasOptionsLoading}
    />
  );
}

export function EvmGasOptionsSyncPlugin({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props) {
  if (!isEvmTransaction(transaction)) return null;

  return (
    <EvmGasOptionsSyncPluginInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
    />
  );
}
