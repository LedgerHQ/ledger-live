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
import {
  useMarketDayChangeByCurrencyId,
  useStockAssetIds,
} from "@features/platform-aggregated-assets";
import { useSelector } from "LLD/hooks/redux";
import { useMarketDayChange } from "LLD/hooks/useMarketDayChange";
import { ASSETS_PRICE_REFRESH_INTERVAL_MS } from "LLD/features/Assets/constants";
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

  const { ids: stockAssetIds } = useStockAssetIds("lld", __APP_VERSION__);
  const stockItems = useMemo(
    () => assetItems.filter(item => stockAssetIds.has(item.currency.id)),
    [assetItems, stockAssetIds],
  );
  const cryptoItems = useMemo(
    () => assetItems.filter(item => !stockAssetIds.has(item.currency.id)),
    [assetItems, stockAssetIds],
  );
  const stockCurrencyIds = useMemo(() => stockItems.map(item => item.currency.id), [stockItems]);

  const { byLedgerId: cryptoDayChange } = useMarketDayChange();
  const stockDayChange = useMarketDayChangeByCurrencyId({
    currencyIds: stockCurrencyIds,
    product: "lld",
    version: __APP_VERSION__,
    pollingInterval: ASSETS_PRICE_REFRESH_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });
  const cryptoTrends = useAllCurrencyTrends(cryptoItems, "day", cryptoDayChange, "market");
  const stockTrends = useAllCurrencyTrends(stockItems, "day", stockDayChange);
  const items = useMemo(
    () =>
      assetItems.map(item => ({
        ...item,
        trend: stockTrends.get(item.currency.id) ?? cryptoTrends.get(item.currency.id) ?? null,
      })),
    [assetItems, cryptoTrends, stockTrends],
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
