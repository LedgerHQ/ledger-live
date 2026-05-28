import { useCallback, useMemo, useState } from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatPriceFragment, formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { useTranslation, useLocale } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import {
  resolveLineChartColorFromPercentChange,
  type LineChartSeries,
} from "LLM/components/LineChart";
import {
  BALANCE_GRAPH_RANGES,
  RANGE_TO_PRICE_CHANGE_KEY,
  isRangeKey,
  type RangeKey,
} from "../../utils/rangeMapping";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";

// Placeholder data until range-driven price series are wired in.
// `stroke` is overridden by the shared LineChart from the `color` prop.
const PLACEHOLDER_SERIES: LineChartSeries[] = [
  {
    id: "asset-detail-price-preview",
    data: [
      1, 2, 5, 12, 56, 3, 33, 34, 56, 55, 100, 101, 102, 103, 12, 105, 106, 107, 108, 109, 110,
    ],
    label: "Price",
    stroke: "",
  },
];

type Params = {
  currency?: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
  hideReceive?: boolean;
};

export function useBalanceGraphViewModel({
  currency,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
  hideReceive,
}: Params) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValueUnit = counterValueCurrency.units[0];
  const { marketCurrency, isLoading } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });

  const [range, setRange] = useState<RangeKey>("1d");

  const ranges = useMemo(
    () =>
      BALANCE_GRAPH_RANGES.map(r => ({
        label: t(`assetDetail.balanceGraph.range.${r}`),
        value: r,
      })),
    [t],
  );

  const onRangeChange = useCallback(
    (value: RangeKey) => {
      if (value === range) return;
      setRange(value);
      track("button_clicked", {
        button: "timeframe",
        timeframe: value,
        page: "Asset Detail",
        currency: currency?.id,
      });
    },
    [range, currency?.id],
  );

  const price = marketCurrency?.price;
  const priceChangePercentage =
    marketCurrency?.priceChangePercentage[RANGE_TO_PRICE_CHANGE_KEY[range]];

  const priceFormatter = useCallback(
    (value: number): FormattedValue => formatPriceFragment(counterValueUnit, value, locale),
    [counterValueUnit, locale],
  );

  const formattedPriceChange = useMemo(() => {
    if (priceChangePercentage == null || price == null) return undefined;
    const delta = price * (priceChangePercentage / 100);
    return formatSignedFiatVariation(delta, counterValueUnit, locale);
  }, [priceChangePercentage, price, locale, counterValueUnit]);

  const rangeTimeLabel = t(`assetDetail.balanceGraph.timeLabel.${range}`);

  // Flatten so token sub-accounts (e.g. ERC-20 stablecoins held inside an
  // Ethereum parent account) are inspected too. Using parent accounts alone
  // would miss token balances and incorrectly surface the Receive CTA on a
  // funded token asset.
  const flatAccounts = useSelector(flattenAccountsSelector);

  const showReceive = useMemo(() => {
    if (hideReceive || !currency) return false;
    const hasAssetFunds = flatAccounts.some(
      a => getAccountCurrency(a).id === currency.id && a.balance.gt(0),
    );
    const hasFundsElsewhere = flatAccounts.some(
      a => getAccountCurrency(a).id !== currency.id && a.balance.gt(0),
    );
    return !hasAssetFunds && hasFundsElsewhere;
  }, [hideReceive, flatAccounts, currency]);

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const onReceivePress = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      page: "Asset Detail",
      currency: currency?.id,
    });
    handleOpenReceiveDrawer();
  }, [handleOpenReceiveDrawer, currency?.id]);

  const series = PLACEHOLDER_SERIES;
  const chartColor = resolveLineChartColorFromPercentChange(priceChangePercentage);

  return {
    price: price ?? 0,
    priceFormatter,
    hasMarketData: price != null,
    priceChangePercentage: priceChangePercentage ?? 0,
    formattedPriceChange,
    rangeTimeLabel,
    ranges,
    selectedRange: range,
    onRangeChange,
    isRangeValue: isRangeKey,
    showReceive,
    onReceivePress,
    isLoading,
    series,
    chartColor,
  };
}
