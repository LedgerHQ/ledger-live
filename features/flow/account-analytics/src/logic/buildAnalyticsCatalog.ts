import type { AssetsData } from "@domain/api-aggregated-assets";
import { selectAssetCurrencyIds } from "@features/platform-aggregated-assets";
import type {
  AnalyticsAccountSource,
  AnalyticsAssetsQuery,
  AnalyticsCatalog,
  AnalyticsCatalogState,
  AnalyticsPositionSource,
} from "../types";
import {
  getAnalyticsPositionAccountId,
  getAnalyticsPositionCurrency,
} from "./analyticsPositionSource";

export type AnalyticsAccountNames = Readonly<Record<string, string | undefined>>;

type AssetMeta = AssetsData["cryptoAssets"][string];

const EMPTY_CATALOG: AnalyticsCatalogState = {
  status: "ready",
  data: { assets: [], accounts: [], positions: [] },
};

function findAssetMeta(assetsData: AssetsData, currencyId: string): AssetMeta | undefined {
  const meta = Object.values(assetsData.cryptoAssets).find(candidate =>
    Object.values(candidate.assetsIds).includes(currencyId),
  );
  return meta && selectAssetCurrencyIds(assetsData, currencyId).includes(currencyId)
    ? meta
    : undefined;
}

export function selectAnalyticsCurrencyIds(
  positions: readonly AnalyticsPositionSource[],
): string[] {
  return [...new Set(positions.map(position => getAnalyticsPositionCurrency(position).id))];
}

export function indexAnalyticsAccountNames(
  accounts: readonly Readonly<{ id: string }>[],
  names: readonly (string | undefined)[],
): AnalyticsAccountNames {
  return Object.fromEntries(accounts.map((account, index) => [account.id, names[index]]));
}

export function buildAnalyticsCatalog(
  positions: readonly AnalyticsPositionSource[],
  accounts: readonly AnalyticsAccountSource[],
  namesById: AnalyticsAccountNames,
  assetsData: AssetsData,
): AnalyticsCatalog {
  const assets = new Map<string, AnalyticsCatalog["assets"][number]>();
  const selectedAccounts = new Set<string>();
  const catalogPositions = positions.map(position => {
    const currency = getAnalyticsPositionCurrency(position);
    const meta = findAssetMeta(assetsData, currency.id);
    const assetId = meta ? `asset:${meta.id}` : `currency:${currency.id}`;
    const accountId = getAnalyticsPositionAccountId(position);
    selectedAccounts.add(accountId);
    if (!assets.has(assetId))
      assets.set(assetId, {
        id: assetId,
        name: meta?.name ?? currency.name,
        ticker: meta?.ticker ?? currency.ticker,
        iconId: currency.id,
      });
    return { positionId: position.id, accountId, currencyId: currency.id, assetId };
  });
  return {
    assets: [...assets.values()].sort((a, b) => a.name.localeCompare(b.name)),
    accounts: accounts
      .filter(account => selectedAccounts.has(account.id))
      .map(account => ({
        id: account.id,
        name: namesById[account.id] ?? account.currency.name,
        iconId: account.currency.id,
        ticker: account.currency.ticker,
        networkName: account.currency.name,
        address: account.freshAddress,
      })),
    positions: catalogPositions,
  };
}

export type AnalyticsCatalogStateInput = Readonly<{
  positions: readonly AnalyticsPositionSource[];
  accounts: readonly AnalyticsAccountSource[];
  namesById: AnalyticsAccountNames;
  assets: AnalyticsAssetsQuery;
}>;

export function createAnalyticsCatalogState({
  positions,
  accounts,
  namesById,
  assets,
}: AnalyticsCatalogStateInput): AnalyticsCatalogState {
  if (positions.length === 0) return EMPTY_CATALOG;
  if (assets.isSuccess && assets.data)
    return {
      status: "ready",
      data: buildAnalyticsCatalog(positions, accounts, namesById, assets.data),
    };
  return { status: assets.isError ? "error" : "loading" };
}
