import { useRef } from "react";
import isEqual from "lodash/isEqual";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { GasOptions, Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";

type EvmGasOptionsSyncProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: EvmTransaction;
  transactionActions: SendFlowTransactionActions;
  evmGasOptions: GasOptions | undefined;
}>;

export function EvmGasOptionsSync({
  account,
  parentAccount,
  transaction,
  transactionActions,
  evmGasOptions,
}: EvmGasOptionsSyncProps) {
  const scheduledGasOptionsRef = useRef<GasOptions | undefined>(undefined);

  const shouldApply =
    evmGasOptions !== undefined && !isEqual(transaction.gasOptions ?? null, evmGasOptions);

  if (shouldApply) {
    // schedule transaction update as a microtask
    if (!isEqual(scheduledGasOptionsRef.current ?? null, evmGasOptions)) {
      scheduledGasOptionsRef.current = evmGasOptions;
      queueMicrotask(() => {
        transactionActions.updateTransaction(currentTx => {
          if ("gasOptions" in currentTx && currentTx.gasOptions) {
            if (isEqual(currentTx.gasOptions, evmGasOptions)) return currentTx;
          }
          const bridge = getAccountBridge(account, parentAccount ?? undefined);
          return bridge.updateTransaction(currentTx, { gasOptions: evmGasOptions });
        });
      });
    }
  }

  return null;
}
