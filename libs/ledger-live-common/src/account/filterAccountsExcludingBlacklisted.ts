import type { AccountLike } from "@ledgerhq/types-live";
import {
  flattenAccounts,
  getAccountCurrency,
} from "@ledgerhq/ledger-wallet-framework/account/index";

/**
 * Flatten accounts and drop any whose currency id is in `blacklistedTokenIds`
 * (hidden-from-portfolio assets). Use with `flattenSourceAccounts: false` when
 * passing the result to portfolio balance helpers.
 */
export function filterAccountsExcludingBlacklisted(
  accounts: AccountLike[],
  blacklistedTokenIds: readonly string[],
): AccountLike[] {
  if (blacklistedTokenIds.length === 0) {
    return accounts;
  }
  const blacklisted = new Set(blacklistedTokenIds);
  return flattenAccounts(accounts).filter(
    account => !blacklisted.has(getAccountCurrency(account).id),
  );
}
