import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { GasOptions } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import type { EvmGasOptionsSyncTransaction } from "../../../utils/isEvmTransaction";

/**
 * Fetches and polls EVM gas options for a given account/transaction.
 * Polling interval is derived from the currency's average block time.
 */
export function useEvmGasOptions(
  account: AccountLike,
  parentAccount: Account | null,
  transaction: EvmGasOptionsSyncTransaction,
): [GasOptions | undefined, Error | undefined, boolean] {
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const interval = mainAccount.currency.blockAvgTime
    ? mainAccount.currency.blockAvgTime * 1000
    : undefined;

  const [gasOptions, error, loading] = useGasOptions({
    currency: mainAccount.currency,
    transaction,
    interval,
  });
  return [gasOptions, error ?? undefined, loading];
}
