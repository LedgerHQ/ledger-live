import type { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getAccountCurrency, listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import type { AssetTableItem } from "@features/platform-assets-table";

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

export function buildAccountAssetItems(account: Account, options: Options): AssetTableItem[] {
  const shownAccounts: AccountLike[] = [
    account,
    ...listSubAccounts(account).filter(tokenAccount => isTokenShown(tokenAccount, options)),
  ];

  const items = shownAccounts.map(shownAccount => {
    const currency = getAccountCurrency(shownAccount);
    return {
      currency,
      balance: shownAccount.balance.toNumber(),
      value: options.calculateCountervalue(currency, shownAccount.balance)?.toNumber() ?? 0,
      accounts: [shownAccount],
      isPlaceholder: false,
    };
  });

  const totalValue = items.reduce((sum, { value }) => sum + value, 0);

  return items
    .map(item => ({ ...item, distribution: totalValue > 0 ? item.value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);
}
