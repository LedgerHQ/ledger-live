import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import type { MarketDataSectionCurrencyData } from "../../hooks/useMarketDataSectionCurrencyData";
import type { MarketStatRow } from "../../types";

const MISSING = "-";

export function useMarketStatsViewModel(currencyData: MarketDataSectionCurrencyData) {
  const { t } = useTranslation();
  const { data, showSkeleton, counterCurrency, locale } = currencyData;

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

    const maxSupply = counterValueFormatter({
      value: data?.maxSupply,
      locale,
      shorten: true,
      ticker: data?.ticker,
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
      },
      {
        key: "max_supply",
        label: t("market.detailsPage.maxSupply"),
        value: maxSupply,
      },
      {
        key: "trading_volume_24h",
        label: t("assetDetails.tradingVolume24h"),
        value: volume24h,
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

  return {
    rows,
    showSkeleton,
    sectionTitle,
    sectionTooltip,
  };
}

export type MarketStatsViewModelResult = ReturnType<typeof useMarketStatsViewModel>;
