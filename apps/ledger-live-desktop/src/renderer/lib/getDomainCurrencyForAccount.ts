import { getAccountCurrency as _getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

// Coerces the legacy (unbranded) account currency to the branded domain union.
// Single `as` is safe: CryptoCurrency/TokenCurrency are pure-brand — structurally identical,
// only `id` differs (string vs string & $brand). Drop this when Account migrates (LIVE-34762).
export function getAccountCurrency(account: AccountLike): CryptoOrTokenCurrency {
  return _getAccountCurrency(account) as CryptoOrTokenCurrency;
}
