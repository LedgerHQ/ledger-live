type WithId = Readonly<{ id: string }>;

type Spendable = Readonly<{ spendableBalance: Readonly<{ gt: (value: number) => boolean }> }>;

export type HeldAsset<TCurrency extends WithId, TAccount extends Spendable, TParent> = Readonly<{
  currency: TCurrency;
  account: TAccount;
  parentAccount?: TParent;
}>;

type TokenAccountLike = Spendable & Readonly<{ token: WithId }>;

type AccountWithTokens<TCoin extends WithId, TTokenAccount extends TokenAccountLike> = Spendable &
  Readonly<{ currency: TCoin; subAccounts?: readonly TTokenAccount[] }>;

export function listHeldAssets<
  TCoin extends WithId,
  TTokenAccount extends TokenAccountLike,
  TAccount extends Spendable,
>(
  account: TAccount & AccountWithTokens<TCoin, TTokenAccount>,
  blacklistedTokenIds: ReadonlySet<string>,
): readonly HeldAsset<TCoin | TTokenAccount["token"], TAccount | TTokenAccount, TAccount>[] {
  const tokens = (account.subAccounts ?? [])
    .filter(({ token }) => !blacklistedTokenIds.has(token.id))
    .map(tokenAccount => ({
      currency: tokenAccount.token,
      account: tokenAccount,
      parentAccount: account,
    }));
  return [{ currency: account.currency, account }, ...tokens];
}

const hasSpendableBalance = ({ account }: HeldAsset<WithId, Spendable, unknown>) =>
  account.spendableBalance.gt(0);

export function hasAnyFunds(assets: readonly HeldAsset<WithId, Spendable, unknown>[]): boolean {
  return assets.some(hasSpendableBalance);
}

export type AssetActionId = "buy" | "sell" | "swap" | "earn";

export type AssetsByAction<T> = Readonly<Record<AssetActionId, readonly T[]>>;

export type AssetActionPredicates = Readonly<{
  isBuyable: (currencyId: string) => boolean;
  isSellable: (currencyId: string) => boolean;
  isSwappable: (currencyId: string) => boolean;
  isStakeable: (currencyId: string) => boolean;
}>;

export function resolveAssetsByAction<T extends HeldAsset<WithId, Spendable, unknown>>(
  assets: readonly T[],
  { isBuyable, isSellable, isSwappable, isStakeable }: AssetActionPredicates,
): AssetsByAction<T> {
  return {
    buy: assets.filter(({ currency }) => isBuyable(currency.id)),
    sell: assets.filter(({ currency }) => isSellable(currency.id)),
    swap: assets.filter(({ currency }) => isSwappable(currency.id)),
    earn: assets.filter(({ currency }) => isStakeable(currency.id)),
  };
}

export type AssetActionSources = Readonly<{
  buyableIds: readonly string[];
  sellableIds: readonly string[];
  swappableIds: readonly string[];
  deactivatedIds: ReadonlySet<string>;
  isStakeable: (currencyId: string) => boolean;
}>;

export function resolveAvailableAssetsByAction<T extends HeldAsset<WithId, Spendable, unknown>>(
  assets: readonly T[],
  { buyableIds, sellableIds, swappableIds, deactivatedIds, isStakeable }: AssetActionSources,
): AssetsByAction<T> {
  const buyable = new Set(buyableIds);
  const sellable = new Set(sellableIds);
  const swappable = new Set(swappableIds);
  const isActive = (currencyId: string) => !deactivatedIds.has(currencyId);
  return resolveAssetsByAction(assets, {
    isBuyable: id => isActive(id) && buyable.has(id),
    isSellable: id => isActive(id) && sellable.has(id),
    isSwappable: id => isActive(id) && swappable.has(id),
    isStakeable: id => isActive(id) && isStakeable(id),
  });
}

export function sortAssetsByValue<T>(
  assets: readonly T[],
  valueOf: (asset: T) => number,
): readonly T[] {
  return assets
    .map(asset => ({ asset, value: valueOf(asset) }))
    .sort((a, b) => b.value - a.value)
    .map(({ asset }) => asset);
}

export function sumAssetValues<T>(
  assets: readonly T[],
  isFunded: (asset: T) => boolean,
  valueOf: (asset: T) => number | undefined,
): number | undefined {
  const funded = assets.filter(isFunded);
  if (funded.length === 0) return 0;
  const values = funded.map(valueOf).filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}
