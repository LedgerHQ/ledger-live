import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getCurrencyForAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, TokenCurrency } from "@domain/entity-currency";

// Bridge legacy→domain — Account getters return unbranded types from packages that cannot import @domain.
// Single `as` (not `as unknown as`) — TS verifies shape overlap, only brand is coerced.
// Remove when Account adopts domain currency types (types-live migration).

export function getDomainCurrencyForAccount(account: AccountLike): CryptoOrTokenCurrency {
  return getCurrencyForAccount(account) as CryptoOrTokenCurrency;
}

export function getDomainTokenFromAccount(account: TokenAccount): TokenCurrency {
  return account.token as TokenCurrency;
}
