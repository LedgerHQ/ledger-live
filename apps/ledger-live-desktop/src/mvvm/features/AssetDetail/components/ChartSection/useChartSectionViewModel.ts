import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useAssetChartData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { formatPrice } from "@ledgerhq/live-currency-format";
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
  type LineChartXAxisConfig,
  type LineChartYAxisConfig,
} from "LLD/components/LineChart";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useHistoryOperationItemsForRootAccounts } from "LLD/features/History/hooks/useHistoryOperationItemsForRootAccounts";
import {
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
} from "LLD/features/History/utils/accountScopeForHistory";
import {
  clampDayChangePercentPointsNearZero,
  getPriceChangeKeyForRange,
  getScrubVariation,
} from "../MarketPriceSection/utils";
import { useAssetChartDateFormatter } from "../../hooks/useAssetChartDateFormatter";
import { useScrubbedPrice } from "../../context/ScrubbedPriceContext";
import {
  groupTransactionsByChartIndex,
  type TransactionInput,
} from "./utils/getTransactionPointMarkers";
import { buildTransactionPointMarker } from "./utils/buildTransactionPointMarker";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

const CHART_BASE_HEIGHT = 240;
const Y_AXIS_OFFSET_BOTTOM_PX = 50;
const CHART_HEIGHT = CHART_BASE_HEIGHT + Y_AXIS_OFFSET_BOTTOM_PX;

/**
 * Returns evenly spaced data indices (always including the first and last point)
 * so the x-axis renders at least `minTicks` labels when enough data is available.
 */
function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= minTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: minTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (minTicks - 1)),
  );
  return Array.from(new Set(ticks));
}

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
  isError: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  onScrubberPositionChange: LineChartScrubberPositionChange;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: LineChartXAxisConfig;
  yAxis: LineChartYAxisConfig;
  points: LineChartPointMarker[];
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
  const allAccounts = useSelector(accountsSelector);
  const countervaluesState = useCountervaluesState();

  const id =
    ledgerId ?? marketData.marketCurrencyData?.ledgerIds?.[0] ?? marketData.marketCurrencyData?.id;

  const {
    data: chartData,
    isLoading,
    isError,
  } = useAssetChartData({ id, counterCurrency, range: selectedRange }, { skip: !id });

  const { series, timestamps } = useMemo(() => {
    const points = chartData?.[selectedRange] ?? [];
    const data: number[] = [];
    const tsList: number[] = [];
    points.forEach(([timestamp, value]) => {
      data.push(value);
      tsList.push(timestamp);
    });
    return {
      series: [
        {
          id: "asset-detail-price",
          data,
          label: "Price",
          // Stroke is required by Series typing but is always overridden by <LineChart /> from `color`.
          stroke: "",
        },
      ] satisfies LineChartSeries[],
      timestamps: tsList,
    };
  }, [chartData, selectedRange]);

  const priceChangeKey = getPriceChangeKeyForRange(selectedRange);
  const rangePercentage = marketData.marketCurrencyData?.priceChangePercentage?.[priceChangeKey];
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

    const groups = groupTransactionsByChartIndex({
      timestamps,
      values: series[0]?.data ?? [],
      transactions,
    });

    const transactionMarkers = groups.map(group =>
      buildTransactionPointMarker(group, t, formatFiat),
    );

    return [...extremaMarkers, ...transactionMarkers];
  }, [series, timestamps, transactions, formatFiat, t]);

  const formatValue = useCallback<LineChartValueFormatter>(
    value =>
      formatPrice(fiatUnit, new BigNumber(value).times(10 ** fiatUnit.magnitude), {
        showCode: true,
        locale,
      }),
    [fiatUnit, locale],
  );

  const formatDate = useAssetChartDateFormatter(selectedRange);

  const tooltipTitle = useCallback<LineChartTooltipTitle>(
    dataIndex => {
      const timestamp = timestamps[dataIndex];
      if (timestamp == null) return undefined;
      return formatDate(timestamp);
    },
    [timestamps, formatDate],
  );

  const xAxis = useMemo<LineChartXAxisConfig>(
    () => ({
      showLine: false,
      ticks: getEvenlySpacedTicks(
        timestamps.length,
        selectedRange === "1d" ? MIN_X_AXIS_TICKS_1D : MIN_X_AXIS_TICKS,
      ),
      tickLabelFormatter: value => {
        const timestamp = timestamps[Number(value)];
        return timestamp == null ? "" : formatDate(timestamp);
      },
    }),
    [timestamps, formatDate, selectedRange],
  );

  const yAxis = useMemo<LineChartYAxisConfig>(
    () => ({
      domain: ({ min, max }) => {
        const range = max - min || Math.abs(max) || 1;
        const valuePerPx = range / CHART_BASE_HEIGHT;
        return {
          min: min - Y_AXIS_OFFSET_BOTTOM_PX * valuePerPx,
          max,
        };
      },
    }),
    [],
  );

  const { setSelection } = useScrubbedPrice();

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) return setSelection(undefined);
      const price = series[0]?.data[index];
      const baselinePrice = series[0]?.data[0];
      const timestamp = timestamps[index];
      if (!Number.isFinite(price) || !Number.isFinite(baselinePrice) || timestamp == null) {
        return setSelection(undefined);
      }
      const { percentage, variationFiat } = getScrubVariation(baselinePrice, price);
      setSelection({ price, timestamp, percentage, variationFiat });
    },
    [series, timestamps, setSelection],
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
    height: CHART_HEIGHT,
    selectedRange,
    onRangeChange: handleRangeChange,
    color,
    isLoading,
    isError,
    formatValue,
    tooltipTitle,
    onScrubberPositionChange,
    showXAxis: true,
    showYAxis: false,
    xAxis,
    yAxis,
    points,
  };
}
