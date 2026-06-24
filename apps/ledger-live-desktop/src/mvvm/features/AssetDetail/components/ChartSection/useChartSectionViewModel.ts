import { useCallback, useMemo, useRef } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import {
  getMinSeriesPointsBetweenTxMarkers,
  groupTransactionsByChartIndex,
  type AssetMarketData,
  type TransactionInput,
} from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { useSelector } from "LLD/hooks/redux";
import {
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartColor,
  type LineChartPointMarker,
  type LineChartRange,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
  type LineChartTooltipTitle,
  type LineChartValueFormatter,
} from "LLD/components/LineChart";
import { createFiatLineChartValueFormatter } from "LLD/components/LineChart/utils/createFiatLineChartValueFormatter";
import { createLineChartTooltipTitle } from "LLD/components/LineChart/utils/createLineChartTooltipTitle";
import {
  buildLineChartBottomPaddedYAxisConfig,
  buildLineChartXAxisConfig,
  LINE_CHART_VIEW_HEIGHT,
} from "LLD/components/LineChart/utils/lineChartAxisConfig";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { hideTransactionsOnChartSelector } from "~/renderer/reducers/market";
import { useHistoryOperationItemsForRootAccounts } from "LLD/features/History/hooks/useHistoryOperationItemsForRootAccounts";
import {
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
} from "LLD/features/History/utils/accountScopeForHistory";
import { clampDayChangePercentPointsNearZero } from "@ledgerhq/live-common/market/utils/resolveRangePriceChange";
import { getScrubVariation } from "@ledgerhq/live-common/market/utils/scrubVariation";
import { resolveRangePriceChange } from "../MarketPriceSection/utils";
import { useAssetDetailChartSeries } from "../../hooks/useAssetDetailChartSeries";
import { useAssetChartDateFormatter } from "../../hooks/useAssetChartDateFormatter";
import { useScrubbedPrice } from "../../context/ScrubbedPriceContext";
import { buildTransactionPointMarker } from "./utils/buildTransactionPointMarker";

type UseChartSectionViewModelProps = Readonly<{
  marketData: AssetMarketData;
  ledgerId?: string;
  currencyId?: string;
  isDistributionLoading: boolean;
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
  distributionItem?: DistributionItem;
}>;

export type ChartSectionViewModelResult = Readonly<{
  series: LineChartSeries[];
  height: number;
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
  color: LineChartColor;
  isLoading: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  onScrubberPositionChange: LineChartScrubberPositionChange;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: ReturnType<typeof buildLineChartXAxisConfig>;
  yAxis: ReturnType<typeof buildLineChartBottomPaddedYAxisConfig>;
  points: LineChartPointMarker[];
  currencyId?: string;
}>;

export function useChartSectionViewModel({
  marketData,
  ledgerId,
  currencyId,
  selectedRange,
  onRangeChange,
  distributionItem,
}: UseChartSectionViewModelProps): ChartSectionViewModelResult {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const fiatUnit = counterValueCurrency.units[0];
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const hideTransactionsOnChart = useSelector(hideTransactionsOnChartSelector);
  const allAccounts = useSelector(accountsSelector);
  const countervaluesState = useCountervaluesState();

  const id =
    ledgerId ?? marketData.marketCurrencyData?.ledgerIds?.[0] ?? marketData.marketCurrencyData?.id;

  // Extract the all-time extrema as stable primitives: marketCurrencyData is a
  // new object on every market poll (athDate/atlDate are fresh Date instances),
  // so depending on it would re-run the series pipeline on each price refresh.
  const marketCurrencyData = marketData.marketCurrencyData;
  const ath = marketCurrencyData?.ath;
  const atl = marketCurrencyData?.atl;
  const athTime = marketCurrencyData?.athDate?.getTime();
  const atlTime = marketCurrencyData?.atlDate?.getTime();

  const {
    prices: currentPrices,
    timestamps: currentTimestamps,
    isLoading: isChartLoading,
    isFetching: isChartFetching,
  } = useAssetDetailChartSeries({
    id,
    counterCurrency,
    selectedRange,
    ath,
    atl,
    athTime,
    atlTime,
  });

  // While the next timeframe loads, keep rendering the previous (non-empty)
  // series so the chart morphs from the old shape (Lumen transition-loading)
  // instead of flashing the empty placeholder. Scoped to `id`: morphing only
  // applies within the same asset (a timeframe switch), never across an asset
  // switch — otherwise we'd grey out the previous asset's shape instead of
  // showing the new asset's loading/empty state.
  const hasData = currentPrices.length > 0;
  const lastRenderedRef = useRef({ id, prices: currentPrices, timestamps: currentTimestamps });
  if (hasData) {
    lastRenderedRef.current = { id, prices: currentPrices, timestamps: currentTimestamps };
  }
  const isLoading = isChartLoading || (isChartFetching && !hasData);
  const canReusePrevious = lastRenderedRef.current.id === id;
  const { prices, timestamps } =
    !hasData && isLoading && canReusePrevious
      ? lastRenderedRef.current
      : { prices: currentPrices, timestamps: currentTimestamps };

  const series = useMemo<LineChartSeries[]>(
    () => [
      {
        id: "asset-detail-price",
        data: prices,
        label: "Price",
        // Stroke is required by Series typing but is always overridden by <LineChart /> from `color`.
        stroke: "",
      },
    ],
    [prices],
  );

  const { percentage: rangePercentage } = resolveRangePriceChange({
    selectedRange,
    chartPrices: prices,
    price: marketCurrencyData?.price,
    priceChangePercentage: marketCurrencyData?.priceChangePercentage,
  });
  const color = resolveLineChartColorFromPercentChange(
    clampDayChangePercentPointsNearZero(rangePercentage),
  );

  const accountIds = useMemo(
    () => new Set((distributionItem?.accounts ?? []).map(account => account.id)),
    [distributionItem?.accounts],
  );

  const rootAccounts = useMemo(
    () =>
      accountIds.size === 0
        ? []
        : filterTopLevelAccountsByAllowedAccountIds(allAccounts, accountIds),
    [allAccounts, accountIds],
  );

  const operationItemsFromRoots = useHistoryOperationItemsForRootAccounts(rootAccounts);

  const transactions = useMemo<TransactionInput[]>(() => {
    const items = filterOperationTableItemsByAllowedAccountIds(operationItemsFromRoots, accountIds);
    return items.map(item => {
      const countervalue = calculate(countervaluesState, {
        from: item.currency,
        to: counterValueCurrency,
        value: item.amount.abs().toNumber(),
        date: item.date,
        disableRounding: true,
      });
      return {
        dateMs: item.date.getTime(),
        direction: item.amount.isNegative() ? "out" : "in",
        fiat: typeof countervalue === "number" ? countervalue : null,
      };
    });
  }, [operationItemsFromRoots, accountIds, countervaluesState, counterValueCurrency]);

  const formatFiat = useCallback(
    (value: number) =>
      formatCurrencyUnit(fiatUnit, new BigNumber(value), { showCode: true, locale, discreet }),
    [fiatUnit, locale, discreet],
  );

  const points = useMemo<LineChartPointMarker[]>(() => {
    const extremaMarkers = getExtremaPointMarkers(series);

    if (hideTransactionsOnChart) return extremaMarkers;

    const groups = groupTransactionsByChartIndex({
      timestamps,
      values: prices,
      transactions,
      minSeriesPointsBetweenMarkers: getMinSeriesPointsBetweenTxMarkers(selectedRange),
    });

    const transactionMarkers = groups.map(group =>
      buildTransactionPointMarker(group, t, formatFiat),
    );

    return [...extremaMarkers, ...transactionMarkers];
  }, [
    series,
    prices,
    timestamps,
    transactions,
    formatFiat,
    t,
    hideTransactionsOnChart,
    selectedRange,
  ]);

  const formatValue = useMemo(
    () => createFiatLineChartValueFormatter(fiatUnit, locale),
    [fiatUnit, locale],
  );

  const formatDate = useAssetChartDateFormatter(selectedRange);

  const tooltipTitle = useMemo(
    () => createLineChartTooltipTitle(timestamps, formatDate),
    [timestamps, formatDate],
  );

  const xAxis = useMemo(
    () => buildLineChartXAxisConfig({ timestamps, selectedRange, formatDate }),
    [timestamps, formatDate, selectedRange],
  );

  const yAxis = useMemo(() => buildLineChartBottomPaddedYAxisConfig(), []);

  const { setSelection } = useScrubbedPrice();

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) return setSelection(undefined);
      const price = prices[index];
      const baselinePrice = prices[0];
      const timestamp = timestamps[index];
      if (!Number.isFinite(price) || !Number.isFinite(baselinePrice) || timestamp == null) {
        return setSelection(undefined);
      }
      const { percentage, variationFiat } = getScrubVariation(baselinePrice, price);
      setSelection({ price, timestamp, percentage, variationFiat });
    },
    [prices, timestamps, setSelection],
  );

  const handleRangeChange = useCallback(
    (range: LineChartRange) => {
      if (range === selectedRange) return;
      setSelection(undefined);
      onRangeChange(range);
      if (currencyId) {
        track("button_clicked", {
          button: "timeframe",
          timeframe: range,
          page: ASSET_DETAIL_TRACKING_PAGE_NAME,
          currency: currencyId,
        });
      }
    },
    [currencyId, selectedRange, onRangeChange, setSelection],
  );

  return {
    series,
    height: LINE_CHART_VIEW_HEIGHT,
    selectedRange,
    onRangeChange: handleRangeChange,
    color,
    isLoading,
    formatValue,
    tooltipTitle,
    onScrubberPositionChange,
    showXAxis: false,
    showYAxis: false,
    xAxis,
    yAxis,
    points,
    currencyId,
  };
}
