import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { ValueChange } from "@ledgerhq/types-live";
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
} from "LLD/components/LineChart";
import { createFiatLineChartValueFormatter } from "LLD/components/LineChart/utils/createFiatLineChartValueFormatter";
import { createLineChartTooltipTitle } from "LLD/components/LineChart/utils/createLineChartTooltipTitle";
import {
  buildLineChartBottomPaddedYAxisConfig,
  buildLineChartXAxisConfig,
  LINE_CHART_VIEW_HEIGHT,
} from "LLD/components/LineChart/utils/lineChartAxisConfig";
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
import {
  ANALYTICS_CHART_RANGES,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
} from "../../utils/portfolioRangeMapping";

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
  valueChange: ValueChange;
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
  xAxis: ReturnType<typeof buildLineChartXAxisConfig>;
  yAxis: ReturnType<typeof buildLineChartBottomPaddedYAxisConfig>;
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

  const formatValue = useMemo(
    () => createFiatLineChartValueFormatter(fiatUnit, locale),
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

  const tooltipTitle = useCallback(
    createLineChartTooltipTitle(timestamps, formatDate),
    [timestamps, formatDate],
  );

  const xAxis = useMemo(
    () => buildLineChartXAxisConfig({ timestamps, selectedRange, formatDate }),
    [timestamps, formatDate, selectedRange],
  );

  const yAxis = useMemo(() => buildLineChartBottomPaddedYAxisConfig(), []);

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

  return {
    title: t("dashboard.header"),
    rangeLabel: t(`time.range.${selectedTimeRange}`),
    balance,
    balanceAvailable: balanceInfo.isAvailable,
    isLoading,
    shouldDisplayBalanceRefreshRework,
    balanceFormatter,
    valueChange: balanceInfo.valueChange,
    series,
    height: LINE_CHART_VIEW_HEIGHT,
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
