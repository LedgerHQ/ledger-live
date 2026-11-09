import type {
  AnalyticsAccountSource,
  AnalyticsAssetsQuery,
  AnalyticsCatalogState,
  AnalyticsPositionSource,
} from "../types";
import { getAnalyticsPositionCurrency } from "./analyticsPositionSource";
import { buildAnalyticsCatalog } from "./buildAnalyticsCatalog";

const EMPTY_CATALOG: AnalyticsCatalogState = {
  status: "ready",
  data: { assets: [], accounts: [], positions: [] },
};

export function selectAnalyticsCurrencyIds(
  positions: readonly AnalyticsPositionSource[],
): string[] {
  return [...new Set(positions.map(position => getAnalyticsPositionCurrency(position).id))];
}

export function indexAnalyticsAccountNames(
  accounts: readonly Readonly<{ id: string }>[],
  names: readonly (string | undefined)[],
): Readonly<Record<string, string | undefined>> {
  return Object.fromEntries(accounts.map((account, index) => [account.id, names[index]]));
}

export type AnalyticsCatalogStateInput = Readonly<{
  positions: readonly AnalyticsPositionSource[];
  accounts: readonly AnalyticsAccountSource[];
  namesById: Readonly<Record<string, string | undefined>>;
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
