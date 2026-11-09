import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import type { Row, Table } from "@tanstack/react-table";
import type { Account } from "@ledgerhq/types-live";
import {
  ACCOUNT_DETAIL_EVENTS,
  ACCOUNT_DETAIL_PAGES,
  accountAssetClickedProps,
} from "@features/flow-account-detail";
import { setTrackingSource, track } from "@shared/analytics";
import {
  useAllCurrencyTrends,
  useAssetsTable,
  type AssetTableItem,
} from "@features/platform-assets-table";
import { useSelector } from "LLD/hooks/redux";
import { useMarketDayChange } from "LLD/hooks/useMarketDayChange";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
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

  const { byLedgerId: marketDayChange } = useMarketDayChange();
  const trends = useAllCurrencyTrends(assetItems, "day", marketDayChange, "market");
  const items = useMemo(
    () => assetItems.map(item => ({ ...item, trend: trends.get(item.currency.id) ?? null })),
    [assetItems, trends],
  );

  const onRowClick = useCallback(
    ({ original }: Row<AssetTableItem>) => {
      track(
        ACCOUNT_DETAIL_EVENTS.assetClicked,
        accountAssetClickedProps(getAccountTrackingFacts(account), original.currency.ticker),
      );
      setTrackingSource(ACCOUNT_DETAIL_PAGES.account);
      navigate(getAssetDetailPath(original.currency.id));
    },
    [account, navigate],
  );

  return {
    table: useAssetsTable(items, { showPriceColumn: false }),
    onRowClick,
  };
}
