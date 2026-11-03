import type { AnalyticsCatalog } from "../types";

export function createAnalyticsCatalogKey(catalog: AnalyticsCatalog): string {
  return JSON.stringify([
    catalog.assets.map(asset => [asset.id, asset.name, asset.ticker, asset.iconId]),
    catalog.accounts.map(account => [
      account.id,
      account.name,
      account.networkName,
      account.address,
    ]),
    catalog.positions.map(position => [
      position.positionId,
      position.accountId,
      position.currencyId,
      position.assetId,
    ]),
  ]);
}
