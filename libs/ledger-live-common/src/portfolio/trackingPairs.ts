import {
  flattenAccounts,
  getAccountCurrency,
  isAccountEmpty,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { resolveTrackingPairs } from "@ledgerhq/live-countervalues/logic";
import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@domain/entity-currency";
import type { Account } from "@ledgerhq/types-live";

// infer the tracking pair from user accounts to know which pairs are concerned
export function inferTrackingPairForAccountsUnresolved(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  yearAgo.setHours(0, 0, 0, 0);
  return flattenAccounts(accounts)
    .filter(a => !isAccountEmpty(a))
    .map(account => {
      const currency = getAccountCurrency(account);
      return {
        from: currency,
        to: countervalue,
        startDate: account.creationDate < yearAgo ? account.creationDate : yearAgo,
      };
    });
}

export function inferTrackingPairForAccounts(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  return resolveTrackingPairs(inferTrackingPairForAccountsUnresolved(accounts, countervalue));
}
