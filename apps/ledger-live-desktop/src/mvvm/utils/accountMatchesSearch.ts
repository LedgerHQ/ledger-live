import { getAccountCurrency, listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import type { AccountLike } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector, type WalletState } from "@ledgerhq/live-wallet/store";

export function accountMatchesSearch(
  walletState: WalletState,
  search: string | undefined | null,
  account: AccountLike,
  subMatch = false,
): boolean {
  if (!search) return true;
  let match: string;
  const accountName = accountNameWithDefaultSelector(walletState, account);
  if (account.type === "Account") {
    match = `${account.currency.ticker}|${account.currency.name}|${accountName}`;
    subMatch =
      subMatch &&
      !!account.subAccounts &&
      listSubAccounts(account).some(token => accountMatchesSearch(walletState, search, token));
  } else {
    const c = getAccountCurrency(account);
    match = `${c.ticker}|${c.name}|${accountName}`;
  }
  return match.toLowerCase().includes(search.toLowerCase()) || subMatch;
}
