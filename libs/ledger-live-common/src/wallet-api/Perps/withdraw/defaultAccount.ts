import type BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { toLedgerCurrencyId } from "./currencyMapping";

/** The supported account with the highest fiat balance; unpriced accounts count as zero. */
export function pickDefaultWithdrawAccount({
  accounts,
  supportedCurrencyIds,
  getFiatBalance,
}: {
  accounts: AccountLike[];
  supportedCurrencyIds: string[];
  getFiatBalance: (account: AccountLike) => BigNumber | undefined;
}): AccountLike | undefined {
  const supported = new Set(supportedCurrencyIds.map(toLedgerCurrencyId));
  let best: { account: AccountLike; fiat: BigNumber | undefined } | undefined;

  for (const account of accounts) {
    if (!supported.has(getAccountCurrency(account).id)) continue;
    const fiat = getFiatBalance(account);
    if (!best || (fiat && (!best.fiat || fiat.isGreaterThan(best.fiat)))) {
      best = { account, fiat };
    }
  }
  return best?.account;
}
