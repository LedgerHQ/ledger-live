import { useMemo } from "react";
import isEqual from "lodash/isEqual";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { SendFlowTransactionActions } from "../../../../types";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";

type EvmGasOptionsSyncProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: EvmTransaction;
  transactionActions: SendFlowTransactionActions;
}>;

export function EvmGasOptionsSync({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: EvmGasOptionsSyncProps) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const gasOptionsInterval = mainAccount.currency.blockAvgTime
    ? mainAccount.currency.blockAvgTime * 1000
    : undefined;
  const [evmGasOptions] = useGasOptions({
    currency: mainAccount.currency,
    transaction,
    interval: gasOptionsInterval,
  });

  const shouldApply =
    evmGasOptions !== undefined && !isEqual(transaction.gasOptions ?? null, evmGasOptions);

  if (shouldApply) {
    transactionActions.updateTransaction(currentTx => {
      if ("gasOptions" in currentTx && currentTx.gasOptions) {
        if (isEqual(currentTx.gasOptions, evmGasOptions)) return currentTx;
      }
      const bridge = getAccountBridge(account, parentAccount ?? undefined);
      return bridge.updateTransaction(currentTx, { gasOptions: evmGasOptions });
    });
  }

  return null;
}
