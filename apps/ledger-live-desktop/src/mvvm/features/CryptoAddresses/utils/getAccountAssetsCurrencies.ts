import { listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountLike } from "@ledgerhq/types-live";

export type AccountAssetCurrency = CryptoCurrency | TokenCurrency;

export function getAccountAssetsCurrencies(
  account: AccountLike,
  blacklistedTokenIds?: readonly string[],
): AccountAssetCurrency[] {
  if (account.type === "TokenAccount") {
    return [account.token as TokenCurrency];
  }

  const allSubs = listSubAccounts(account);
  const blacklistedTokenIdsSet = blacklistedTokenIds?.length ? new Set(blacklistedTokenIds) : null;
  const subs = blacklistedTokenIdsSet
    ? allSubs.filter(sub => !blacklistedTokenIdsSet.has(sub.token.id))
    : allSubs;

  if (subs.length === 0) {
    return [account.currency as CryptoCurrency];
  }

  const currencies: AccountAssetCurrency[] = [];
  if (!account.balance.isZero()) {
    currencies.push(account.currency as CryptoCurrency);
  }
  for (const sub of subs) {
    currencies.push(sub.token as TokenCurrency);
  }
  return currencies;
}
