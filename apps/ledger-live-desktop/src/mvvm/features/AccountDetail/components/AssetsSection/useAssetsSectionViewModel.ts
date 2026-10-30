import { useMemo } from "react";
import type { Table } from "@tanstack/react-table";
import type { Account } from "@ledgerhq/types-live";
import {
  useAllCurrencyTrends,
  useAssetsTable,
  type AssetTableItem,
} from "@features/platform-assets-table";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { buildAccountAssetItems } from "../../utils/buildAccountAssetItems";

export type AssetsSectionViewModel = Readonly<{
  table: Table<AssetTableItem>;
}>;

export function useAssetsSectionViewModel(account: Account): AssetsSectionViewModel {
  const hideEmptyTokenAccounts = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();

  const assetItems = useMemo(
    () =>
      buildAccountAssetItems(account, {
        hideEmptyTokenAccounts,
        blacklistedTokenIds: new Set(blacklistedTokenIds),
        calculateCountervalue,
      }),
    [account, hideEmptyTokenAccounts, blacklistedTokenIds, calculateCountervalue],
  );

  const trends = useAllCurrencyTrends(assetItems, "day");
  const items = useMemo(
    () => assetItems.map(item => ({ ...item, trend: trends.get(item.currency.id) ?? null })),
    [assetItems, trends],
  );

  return {
    table: useAssetsTable(items, { showPriceColumn: false }),
  };
}
