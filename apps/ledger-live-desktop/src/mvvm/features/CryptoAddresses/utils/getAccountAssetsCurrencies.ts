import { listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";

export type AccountAssetCurrency = CryptoCurrency | TokenCurrency;

export function getAccountAssetsCurrencies(account: AccountLike): AccountAssetCurrency[] {
  if (account.type === "TokenAccount") {
    return [account.token];
  }

  const subs = listSubAccounts(account);
  if (subs.length === 0) {
    return [account.currency];
  }

  const currencies: AccountAssetCurrency[] = [];
  if (!account.balance.isZero()) {
    currencies.push(account.currency);
  }
  for (const sub of subs) {
    currencies.push(sub.token);
  }
  return currencies;
}
