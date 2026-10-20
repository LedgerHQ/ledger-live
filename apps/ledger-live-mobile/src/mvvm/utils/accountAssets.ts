import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type AccountAsset = Readonly<{
  currency: CryptoOrTokenCurrency;
  account: AccountLike;
  parentAccount?: Account;
}>;

export function listAccountAssets(
  account: Account,
  blacklistedTokenIds: ReadonlySet<string>,
): readonly AccountAsset[] {
  const tokens = (account.subAccounts ?? [])
    .filter(({ token }) => !blacklistedTokenIds.has(token.id))
    .map(tokenAccount => ({
      currency: tokenAccount.token,
      account: tokenAccount,
      parentAccount: account,
    }));
  return [{ currency: account.currency, account }, ...tokens];
}

export function listSpendableAssets(assets: readonly AccountAsset[]): readonly AccountAsset[] {
  return assets.filter(({ account }) => account.spendableBalance.gt(0));
}

export function hasAnyFunds(assets: readonly AccountAsset[]): boolean {
  return listSpendableAssets(assets).length > 0;
}
