import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useAllCurrencyTrends } from "LLD/features/Assets/hooks/useAllCurrencyTrends";
import { useOnDemandCurrenciesCountervalues } from "~/renderer/hooks/useOnDemandCountervalues";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { buildAssetsPagePath } from "LLD/features/Assets/utils/buildAssetsPagePath";
import { ASSETS_PAGE_CATEGORY_STOCKS, MAX_STOCKS_TO_DISPLAY } from "LLD/features/Assets/constants";
import type { AssetSectionData, AssetTableItem } from "LLD/features/Assets/types";

const TRACKING_SOURCE = "Portfolio";

type PortfolioStocksViewModelResult = {
  isLoading: boolean;
  isError: boolean;
  stocksCount: number;
  section: AssetSectionData;
};

export function usePortfolioStocksViewModel(): PortfolioStocksViewModelResult {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorizedAssets, isLoadingStocks, isStocksError } = useCategorizedAssetsFromPortfolio();

  const items = useMemo<AssetTableItem[]>(
    () => categorizedAssets.stocks.map(item => ({ ...item, isPlaceholder: false })),
    [categorizedAssets.stocks],
  );

  const stocksToDisplay = useMemo(() => items.slice(0, MAX_STOCKS_TO_DISPLAY), [items]);

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const currencies = useMemo(() => stocksToDisplay.map(i => i.currency), [stocksToDisplay]);
  useOnDemandCurrenciesCountervalues(currencies, counterValueCurrency);

  const trends = useAllCurrencyTrends(stocksToDisplay, "day");
  const itemsWithTrend = useMemo(
    () => stocksToDisplay.map(item => ({ ...item, trend: trends.get(item.currency.id) ?? null })),
    [stocksToDisplay, trends],
  );

  const onNavigate = useCallback(() => {
    track("button_clicked", { button: "asset_list", type: "stocks", page: TRACKING_SOURCE });
    navigate(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_STOCKS));
  }, [navigate]);

  const onItemClick = useCallback(
    (item: AssetTableItem) => {
      setTrackingSource(TRACKING_SOURCE);
      navigate(`/asset/${item.currency.id}`);
    },
    [navigate],
  );

  const section = useMemo<AssetSectionData>(
    () => ({
      sectionId: "stocks",
      title: t("assets.stocks"),
      items: itemsWithTrend,
      totalCount: items.length,
      onNavigate,
      onItemClick,
    }),
    [t, itemsWithTrend, items.length, onNavigate, onItemClick],
  );

  return {
    isLoading: isLoadingStocks,
    isError: isStocksError,
    stocksCount: items.length,
    section,
  };
}
