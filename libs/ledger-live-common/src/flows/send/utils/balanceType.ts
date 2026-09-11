import type { AccountLike } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { sendFeatures } from "../../../bridge/descriptor/send/features";

/**
 * Spendable balance of the pool the transaction draws from, for coins holding several
 * (ex: Zcash transparent vs shielded). `undefined` for single-balance coins and until the
 * user picks a pool, so callers fall back to the account balance.
 */
export function getSelectedBalanceTypeBalance(
  account: AccountLike | null | undefined,
  transaction: unknown,
): BigNumber | undefined {
  if (!account || !transaction) return undefined;
  const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
  if (!config) return undefined;
  const selectedId = config.getSelectedOptionId(transaction);
  if (!selectedId) return undefined;
  return config.getOptions({ account }).find(option => option.id === selectedId)?.balance;
}
