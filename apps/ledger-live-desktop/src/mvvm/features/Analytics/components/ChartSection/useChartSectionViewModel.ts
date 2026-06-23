import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { formatPrice } from "@ledgerhq/live-currency-format";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import {
  type PortfolioBalanceInfo,
  usePortfolioBalanceDisplayState,
} from "LLD/hooks/usePortfolioBalanceDisplayState";
import {
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartColor,
  type LineChartRange,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
  type LineChartTooltipTitle,
  type LineChartValueFormatter,
  type LineChartXAxisConfig,
  type LineChartYAxisConfig,
} from "LLD/components/LineChart";
import { usePortfolio } from "~/renderer/actions/portfolio";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { setSelectedTimeRange } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { useAssetChartDateFormatter } from "LLD/features/AssetDetail/hooks/useAssetChartDateFormatter";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import {
  ANALYTICS_CHART_RANGES,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
} from "../../utils/portfolioRangeMapping";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;
const CHART_BASE_HEIGHT = 240;
const Y_AXIS_OFFSET_BOTTOM_PX = 50;
const CHART_HEIGHT = CHART_BASE_HEIGHT + Y_AXIS_OFFSET_BOTTOM_PX;

function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= minTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: minTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (minTicks - 1)),
  );
  return Array.from(new Set(ticks));
}

type UseChartSectionViewModelProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
}>;

export type ChartSectionViewModelResult = Readonly<{
  title: string;
  rangeLabel: string;
  balance: number;
  balanceAvailable: boolean;
  isLoading: boolean;
  shouldDisplayBalanceRefreshRework: boolean;
  balanceFormatter: (value: number) => FormattedValue;
  percentageText: string;
  trendVariant: "positive" | "negative" | "neutral";
  series: LineChartSeries[];
  height: number;
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
  color: LineChartColor;
  isChartLoading: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  onScrubberPositionChange: LineChartScrubberPositionChange;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: LineChartXAxisConfig;
  yAxis: LineChartYAxisConfig;
  points: ReturnType<typeof getExtremaPointMarkers>;
  ranges: typeof ANALYTICS_CHART_RANGES;
  discreet: boolean;
}>;

export function useChartSectionViewModel({
  balanceInfo,
}: UseChartSectionViewModelProps): ChartSectionViewModelResult {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const portfolio = usePortfolio();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("desktop");
  const { isLoading } = usePortfolioBalanceDisplayState();
  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const fiatUnit = counterValue.units[0];
  const [hoveredBalance, setHoveredBalance] = useState<number | null>(null);

  const { prices, timestamps } = useMemo(() => {
    const history = portfolio.balanceHistory;
    return {
      prices: history.map(point => point.value),
      timestamps: history.map(point => point.date.getTime()),
    };
  }, [portfolio.balanceHistory]);

  const series = useMemo<LineChartSeries[]>(
    () => [
      {
        id: "analytics-portfolio-balance",
        data: prices,
        label: t("dashboard.header"),
        stroke: "",
      },
    ],
    [prices, t],
  );

  const color = resolveLineChartColorFromPercentChange(
    balanceInfo.valueChange.percentage != null
      ? balanceInfo.valueChange.percentage * 100
      : undefined,
  );

  const points = useMemo(() => getExtremaPointMarkers(series), [series]);

  const formatValue = useCallback<LineChartValueFormatter>(
    value =>
      formatPrice(fiatUnit, new BigNumber(value).times(10 ** fiatUnit.magnitude), {
        showCode: true,
        locale,
      }),
    [fiatUnit, locale],
  );

  const balanceFormatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), {
        locale,
        showCode: true,
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

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) {
        setHoveredBalance(null);
        return;
      }
      const value = prices[index];
      setHoveredBalance(Number.isFinite(value) ? value : null);
    },
    [prices],
  );

  const onRangeChange = useCallback(
    (range: LineChartRange) => {
      const portfolioRange = lineChartRangeToPortfolioRange(range);
      if (!portfolioRange || portfolioRange === selectedTimeRange) return;
      setHoveredBalance(null);
      dispatch(setSelectedTimeRange(portfolioRange));
      track("timeframe_clicked", { timeframe: portfolioRange });
    },
    [dispatch, selectedTimeRange],
  );

  const balance = hoveredBalance ?? balanceInfo.totalBalance;
  const isChartLoading = !portfolio.balanceAvailable && portfolio.balanceHistory.length === 0;
  const { percentageText, variant: trendVariant } = useTrendViewModel({
    valueChange: balanceInfo.valueChange,
    useDiscreetMasking: true,
  });

  return {
    title: t("dashboard.header"),
    rangeLabel: t(`time.range.${selectedTimeRange}`),
    balance,
    balanceAvailable: balanceInfo.isAvailable,
    isLoading,
    shouldDisplayBalanceRefreshRework,
    balanceFormatter,
    percentageText,
    trendVariant,
    series,
    height: CHART_HEIGHT,
    selectedRange,
    onRangeChange,
    color,
    isChartLoading,
    formatValue,
    tooltipTitle,
    onScrubberPositionChange,
    showXAxis: false,
    showYAxis: false,
    xAxis,
    yAxis,
    points,
    ranges: ANALYTICS_CHART_RANGES,
    discreet,
  };
}
