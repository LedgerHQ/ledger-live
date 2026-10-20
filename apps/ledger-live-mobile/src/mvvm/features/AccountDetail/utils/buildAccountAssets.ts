import type { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { Asset } from "~/types/asset";

type Options = Readonly<{
  hideEmptyTokenAccounts: boolean;
  blacklistedTokenIds: ReadonlySet<string>;
  calculateCountervalue: (currency: Currency, value: BigNumber) => BigNumber | null | undefined;
}>;

function isTokenShown(
  tokenAccount: AccountLike,
  { hideEmptyTokenAccounts, blacklistedTokenIds }: Options,
): boolean {
  if (blacklistedTokenIds.has(getAccountCurrency(tokenAccount).id)) return false;
  return !hideEmptyTokenAccounts || !tokenAccount.balance.isZero();
}

function toAsset(account: AccountLike, { calculateCountervalue }: Options): Asset {
  const currency = getAccountCurrency(account);
  return {
    currency,
    accounts: [account],
    amount: account.balance.toNumber(),
    countervalue: calculateCountervalue(currency, account.balance)?.toNumber(),
  };
}

function compareByCountervalueDesc(a: Asset, b: Asset): number {
  if (a.countervalue === undefined) return b.countervalue === undefined ? 0 : 1;
  if (b.countervalue === undefined) return -1;
  return b.countervalue - a.countervalue;
}

export function buildAccountAssets(account: Account, options: Options): Asset[] {
  const shownAccounts: AccountLike[] = [
    account,
    ...(account.subAccounts ?? []).filter(tokenAccount => isTokenShown(tokenAccount, options)),
  ];

  return shownAccounts
    .map(shownAccount => toAsset(shownAccount, options))
    .sort(compareByCountervalueDesc);
}
