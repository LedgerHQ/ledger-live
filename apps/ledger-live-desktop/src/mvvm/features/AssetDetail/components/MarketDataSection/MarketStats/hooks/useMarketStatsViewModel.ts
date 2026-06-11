import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { resolveMaxSupplyDisplay } from "@ledgerhq/asset-detail";
import type { MarketDataSectionCurrencyData } from "../../hooks/useMarketDataSectionCurrencyData";
import type { MarketStatRow } from "../../types";

const MISSING = "-";

export function useMarketStatsViewModel(currencyData: MarketDataSectionCurrencyData) {
  const { t } = useTranslation();
  const { data, showSkeleton, counterCurrency, locale, ledgerCurrencyId } = currencyData;

  const sectionTitle = t("assetDetails.marketStats");
  const sectionTooltip = t("assetDetails.marketStatsTooltip");

  const rows: MarketStatRow[] = useMemo(() => {
    const marketCap = counterValueFormatter({
      value: data?.marketcap,
      currency: counterCurrency.toUpperCase(),
      locale,
      shorten: true,
    });

    const circulating = counterValueFormatter({
      value: data?.circulatingSupply,
      locale,
      shorten: true,
      ticker: data?.ticker,
    });

    const maxSupply = resolveMaxSupplyDisplay({
      maxSupply: data?.maxSupply,
      circulatingSupply: data?.circulatingSupply,
      formatValue: value =>
        counterValueFormatter({ value, locale, shorten: true, ticker: data?.ticker }),
    });

    const volume24h = counterValueFormatter({
      value: data?.totalVolume,
      currency: counterCurrency.toUpperCase(),
      locale,
      shorten: true,
    });

    const marketRank =
      data?.marketcapRank != null && data.marketcapRank > 0 ? `#${data.marketcapRank}` : MISSING;

    return [
      {
        key: "market_cap",
        label: t("market.marketList.marketCap"),
        value: marketCap,
        tooltip: t("assetDetails.marketCapTooltip"),
      },
      {
        key: "market_rank",
        label: t("assetDetails.marketRank"),
        value: marketRank,
      },
      {
        key: "circulating_supply",
        label: t("market.detailsPage.circulatingSupply"),
        value: circulating,
        tooltip: t("assetDetails.circulatingSupplyTooltip"),
      },
      {
        key: "max_supply",
        label: t("market.detailsPage.maxSupply"),
        value: maxSupply,
        tooltip: t("assetDetails.maxSupplyTooltip"),
      },
      {
        key: "trading_volume_24h",
        label: t("assetDetails.tradingVolume24h"),
        value: volume24h,
        tooltip: t("assetDetails.tradingVolume24hTooltip"),
      },
    ];
  }, [
    counterCurrency,
    data?.circulatingSupply,
    data?.marketcap,
    data?.marketcapRank,
    data?.maxSupply,
    data?.ticker,
    data?.totalVolume,
    locale,
    t,
  ]);

  const onTooltipOpen = useCallback(
    (statType: string, open: boolean) => {
      if (open && ledgerCurrencyId) {
        track("button_clicked", {
          button: "market_stat_definition",
          currency: ledgerCurrencyId,
          type: statType,
          page: ASSET_DETAIL_TRACKING_PAGE_NAME,
        });
      }
    },
    [ledgerCurrencyId],
  );

  return {
    rows,
    showSkeleton,
    sectionTitle,
    sectionTooltip,
    onTooltipOpen,
  };
}

export type MarketStatsViewModelResult = ReturnType<typeof useMarketStatsViewModel>;
