import { useCallback, useMemo } from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useTranslation, useLocale } from "~/context/Locale";
import { track } from "~/analytics";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

type StatRow = {
  key: string;
  label: string;
  value: string;
  tooltip?: { title: string; content: string };
};

export function useMarketStatsViewModel(currency: AssetDetailCurrencyProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { marketCurrency, counterCurrency, isLoading, isError } = useAssetMarketData(currency);

  const stats: StatRow[] = useMemo(() => {
    if (!marketCurrency) return [];

    const { marketcap, marketcapRank, circulatingSupply, maxSupply, totalVolume, ticker } =
      marketCurrency;

    return [
      {
        key: "market_cap",
        label: t("assetDetail.marketStats.marketCap"),
        value:
          marketcap !== undefined && marketcap !== null
            ? counterValueFormatter({
                currency: counterCurrency,
                value: marketcap,
                shorten: true,
                locale,
                t,
              })
            : "-",
      },
      {
        key: "market_rank",
        label: t("assetDetail.marketStats.marketRank"),
        value: marketcapRank ? `#${marketcapRank}` : "-",
      },
      {
        key: "circulating_supply",
        label: t("assetDetail.marketStats.circulatingSupply"),
        value: circulatingSupply
          ? counterValueFormatter({
              value: circulatingSupply,
              shorten: true,
              locale,
              t,
              ticker,
            })
          : "-",
        tooltip: {
          title: t("assetDetail.marketStats.circulatingSupply"),
          content: t("assetDetail.marketStats.circulatingSupplyTooltip"),
        },
      },
      {
        key: "max_supply",
        label: t("assetDetail.marketStats.maxSupply"),
        value: maxSupply
          ? counterValueFormatter({
              value: maxSupply,
              shorten: true,
              locale,
              t,
              ticker,
            })
          : "-",
        tooltip: {
          title: t("assetDetail.marketStats.maxSupply"),
          content: t("assetDetail.marketStats.maxSupplyTooltip"),
        },
      },
      {
        key: "trading_volume",
        label: t("assetDetail.marketStats.tradingVolume"),
        value: totalVolume
          ? counterValueFormatter({
              currency: counterCurrency,
              value: totalVolume,
              shorten: true,
              locale,
              t,
            })
          : "-",
      },
    ];
  }, [marketCurrency, counterCurrency, locale, t]);

  const onTooltipOpen = useCallback(
    (statName: string, open: boolean) => {
      if (open) {
        track("info_bubble_pressed", {
          currency: currency?.id,
          stat_name: statName,
          page: "Asset Detail",
        });
      }
    },
    [currency?.id],
  );

  return {
    stats,
    isLoading,
    isError,
    hasData: !!marketCurrency,
    onTooltipOpen,
  };
}

export type MarketStatsViewModelResult = ReturnType<typeof useMarketStatsViewModel>;
