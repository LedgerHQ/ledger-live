import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEvmGasOptions } from "../../Amount/hooks/useEvmGasOptions";
import { EvmGasOptionsSyncPluginEvm } from "../../Amount/components/plugins/EvmGasOptionsSyncPluginEvm";
import { CustomFeesScreenInnerBase } from "./CustomFeesScreenInnerBase";

type CustomFeesScreenInnerWithAmountPluginsProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  stableTransaction: Transaction;
  evmTransaction: EvmTransaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function CustomFeesScreenInnerWithAmountPlugins({
  account,
  parentAccount,
  stableTransaction,
  evmTransaction,
  status,
  currency,
  transactionActions,
  onConfirm,
}: CustomFeesScreenInnerWithAmountPluginsProps) {
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
      <CustomFeesScreenInnerBase
        account={account}
        parentAccount={parentAccount}
        transaction={transactionForViewModel}
        status={status}
        currency={currency}
        transactionActions={transactionActions}
        onConfirm={onConfirm}
      />
    </>
  );
}
