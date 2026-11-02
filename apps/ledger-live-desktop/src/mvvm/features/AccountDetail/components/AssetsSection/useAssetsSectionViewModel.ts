import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type { Row, Table } from "@tanstack/react-table";
import type { Account } from "@ledgerhq/types-live";
import { setTrackingSource } from "@shared/analytics";
import {
  useAllCurrencyTrends,
  useAssetsTable,
  type AssetTableItem,
} from "@features/platform-assets-table";
import { useSelector } from "LLD/hooks/redux";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";
import { buildAccountAssetItems } from "../../utils/buildAccountAssetItems";

export type AssetsSectionViewModel = Readonly<{
  table: Table<AssetTableItem>;
  onRowClick: (row: Row<AssetTableItem>) => void;
}>;

export function useAssetsSectionViewModel(account: Account): AssetsSectionViewModel {
  const navigate = useNavigate();
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

  const onRowClick = useCallback(
    ({ original }: Row<AssetTableItem>) => {
      setTrackingSource(ACCOUNT_DETAIL_TRACKING_PAGE_NAME);
      navigate(getAssetDetailPath(original.currency.id));
    },
    [navigate],
  );

  return {
    table: useAssetsTable(items, { showPriceColumn: false }),
    onRowClick,
  };
}
