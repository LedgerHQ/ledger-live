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
  // A transaction can carry a pool the account no longer offers (ex: a shielded selection
  // kept after the viewing key is gone), which must read as no selection at all.
  if (!config.getOptions({ account }).some(option => option.id === selectedId)) return undefined;
  return config.getSelectableBalance({ account, optionId: selectedId });
}
