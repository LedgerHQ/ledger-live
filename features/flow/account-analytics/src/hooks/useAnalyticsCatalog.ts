import { useMemo } from "react";
import type { WalletApp } from "@domain/api-aggregated-assets";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";
import type { AnalyticsAccountSource, AnalyticsCatalogState, AnalyticsPositionOf } from "../types";
import { selectEligibleAnalyticsPositions } from "../logic/buildAnalyticsCatalog";
import {
  createAnalyticsCatalogState,
  indexAnalyticsAccountNames,
  selectAnalyticsCurrencyIds,
} from "../logic/createAnalyticsCatalogState";

export type UseAnalyticsCatalogInput<Account extends AnalyticsAccountSource> = Readonly<{
  accounts: readonly Account[];
  accountNames: readonly (string | undefined)[];
  blacklistedIds: readonly string[];
  isConfirmed: (operation: Account["operations"][number], account: Account) => boolean;
  product: WalletApp;
  version: string;
}>;

export type AnalyticsCatalogResult<Account extends AnalyticsAccountSource> = Readonly<{
  catalog: AnalyticsCatalogState;
  positions: readonly AnalyticsPositionOf<Account>[];
  refreshCatalog: (() => void) | undefined;
}>;

export function useAnalyticsCatalog<Account extends AnalyticsAccountSource>({
  accounts,
  accountNames,
  blacklistedIds,
  isConfirmed,
  product,
  version,
}: UseAnalyticsCatalogInput<Account>): AnalyticsCatalogResult<Account> {
  const namesById = useMemo(
    () => indexAnalyticsAccountNames(accounts, accountNames),
    [accounts, accountNames],
  );
  const positions = useMemo(
    () => selectEligibleAnalyticsPositions(accounts, blacklistedIds, isConfirmed),
    [accounts, blacklistedIds, isConfirmed],
  );
  const currencyIds = useMemo(() => selectAnalyticsCurrencyIds(positions), [positions]);
  const isEmpty = currencyIds.length === 0;
  const { data, isSuccess, isError, refetch } = useChunkedAssetsData({
    currencyIds,
    product,
    version,
    skip: isEmpty,
  });
  const catalog = useMemo(
    () =>
      createAnalyticsCatalogState({
        positions,
        accounts,
        namesById,
        assets: { data, isSuccess, isError },
      }),
    [positions, accounts, namesById, data, isSuccess, isError],
  );
  return { catalog, positions, refreshCatalog: isEmpty ? undefined : refetch };
}
