import type { AccountAsset } from "LLM/utils/accountAssets";

export type AssetActionId = "buy" | "sell" | "swap" | "earn";

export type AccountAssetsByAction = Readonly<Record<AssetActionId, readonly AccountAsset[]>>;

type Predicates = Readonly<{
  isBuyable: (currencyId: string) => boolean;
  isSellable: (currencyId: string) => boolean;
  isSwappable: (currencyId: string) => boolean;
  isStakeable: (currencyId: string) => boolean;
}>;

const hasSpendableBalance = ({ account }: AccountAsset) => account.spendableBalance.gt(0);

export function resolveAccountAssetsByAction(
  assets: readonly AccountAsset[],
  { isBuyable, isSellable, isSwappable, isStakeable }: Predicates,
): AccountAssetsByAction {
  return {
    buy: assets.filter(({ currency }) => isBuyable(currency.id)),
    sell: assets.filter(asset => isSellable(asset.currency.id) && hasSpendableBalance(asset)),
    swap: assets.filter(({ currency }) => isSwappable(currency.id)),
    earn: assets.filter(asset => isStakeable(asset.currency.id) && hasSpendableBalance(asset)),
  };
}
