import { useCallback, useMemo } from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useTranslation, useLocale } from "~/context/Locale";
import { track } from "~/analytics";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { resolveMaxSupplyDisplay } from "@ledgerhq/asset-detail";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

type StatRow = {
  key: string;
  label: string;
  value: string;
  tooltip?: { title: string; content: string };
};

type Params = {
  currency: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
};

export function useMarketStatsViewModel({
  currency,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
}: Params) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { marketCurrency, counterCurrency, isLoading, isError } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });

  const stats: StatRow[] = useMemo(() => {
    if (!marketCurrency) return [];

    const { marketcap, marketcapRank, circulatingSupply, maxSupply, totalVolume } = marketCurrency;
    const supplyTicker = marketCurrency.ticker || currency?.ticker || "";

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
        tooltip: {
          title: t("assetDetail.marketStats.marketCap"),
          content: t("assetDetail.marketStats.marketCapTooltip"),
        },
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
              ticker: supplyTicker,
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
        value: resolveMaxSupplyDisplay({
          maxSupply,
          circulatingSupply,
          formatValue: value =>
            counterValueFormatter({ value, shorten: true, locale, t, ticker: supplyTicker }),
        }),
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
        tooltip: {
          title: t("assetDetail.marketStats.tradingVolume"),
          content: t("assetDetail.marketStats.tradingVolumeTooltip"),
        },
      },
    ];
  }, [marketCurrency, counterCurrency, locale, t, currency?.ticker]);

  const onTooltipOpen = useCallback(
    (statName: string, open: boolean) => {
      if (open) {
        track("button_clicked", {
          button: "market_stat_definition",
          currency: currency?.id,
          type: statName,
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
