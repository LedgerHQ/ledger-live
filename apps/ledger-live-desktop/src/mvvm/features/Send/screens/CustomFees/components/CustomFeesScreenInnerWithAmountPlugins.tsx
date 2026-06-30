import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { EvmGasOptionsSyncTransaction } from "../../../utils/isEvmTransaction";
import { useEvmGasOptions } from "../../Amount/hooks/useEvmGasOptions";
import { EvmGasOptionsSyncPluginEvm } from "../../Amount/components/plugins/EvmGasOptionsSyncPluginEvm";
import { CustomFeesScreenInnerBase } from "./CustomFeesScreenInnerBase";

type CustomFeesScreenInnerWithAmountPluginsProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  stableTransaction: Transaction;
  evmTransaction: EvmGasOptionsSyncTransaction;
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
      return Object.assign({}, stableTransaction, { gasOptions: evmGasOptions });
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
