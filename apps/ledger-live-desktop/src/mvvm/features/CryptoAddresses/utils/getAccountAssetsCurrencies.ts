import { listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export type AccountAssetCurrency = CryptoCurrency | TokenCurrency;

export function getAccountAssetsCurrencies(
  account: AccountLike,
  blacklistedTokenIds?: readonly string[],
  isNativeBalanceZero: (account: Account) => boolean = legacyAccount =>
    legacyAccount.balance.isZero(),
): AccountAssetCurrency[] {
  if (account.type === "TokenAccount") {
    return [account.token];
  }

  const allSubs = listSubAccounts(account);
  const blacklistedTokenIdsSet = blacklistedTokenIds?.length ? new Set(blacklistedTokenIds) : null;
  const subs = blacklistedTokenIdsSet
    ? allSubs.filter(sub => !blacklistedTokenIdsSet.has(sub.token.id))
    : allSubs;

  if (subs.length === 0) {
    return [account.currency];
  }

  const currencies: AccountAssetCurrency[] = [];
  if (!isNativeBalanceZero(account)) {
    currencies.push(account.currency);
  }
  for (const sub of subs) {
    currencies.push(sub.token);
  }
  return currencies;
}
