import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { formatPrice, formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import { useCountervaluesState } from "~/reducers/countervalues";
import { accountsSelector } from "~/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  selectedTimeRangeSelector,
} from "~/reducers/settings";
import { setSelectedTimeRange } from "~/actions/settings";
import { track } from "~/analytics";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";
import {
  DEFAULT_LINE_CHART_HEIGHT,
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
  type LineChartTooltipTitle,
  type LineChartValueFormatter,
} from "LLM/components/LineChart";
import {
  ANALYTICS_CHART_RANGES,
  isAnalyticsChartRange,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
  type AnalyticsChartRange,
} from "LLM/features/Analytics/utils/portfolioRangeMapping";
import { resolveAnalyticsValueChange } from "LLM/features/Analytics/utils/resolveAnalyticsValueChange";
import {
  buildAnalyticsChartXAxisConfig,
  buildAnalyticsChartYAxisConfig,
} from "LLM/features/Analytics/utils/chartAxisConfig";
import type { ChartSectionViewModel } from "./types";

export function useChartSectionViewModel(): ChartSectionViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(accountsSelector);
  const countervalues = useCountervaluesState();
  const discreet = useSelector(discreetModeSelector);
  const portfolio = usePortfolioAllAccounts();
  const { displayedBalance, isBalanceAvailable } = usePortfolioBalanceForDisplay();

  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const fiatUnit = counterValue.units[0];
  const [hoveredBalance, setHoveredBalance] = useState<number | null>(null);

  const valueChange = useMemo(
    () =>
      resolveAnalyticsValueChange({
        selectedTimeRange,
        accounts,
        currentBalance: displayedBalance,
        portfolio,
        cvState: countervalues,
        counterValue,
      }),
    [selectedTimeRange, accounts, displayedBalance, portfolio, countervalues, counterValue],
  );

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
        label: t("analytics.title"),
        stroke: "",
      },
    ],
    [prices, t],
  );

  const formatValue = useMemo<LineChartValueFormatter>(
    () => value =>
      formatPrice(fiatUnit, new BigNumber(value), {
        showCode: true,
        locale,
        discreet,
      }),
    [fiatUnit, locale, discreet],
  );

  const dateFormatters = useMemo(
    () => ({
      hour: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "numeric" }),
      day: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    }),
    [locale],
  );

  const formatDate = useCallback(
    (timestamp: number) =>
      (selectedRange === "1d" ? dateFormatters.hour : dateFormatters.day).format(
        new Date(timestamp),
      ),
    [selectedRange, dateFormatters],
  );

  const tooltipTitle = useMemo<LineChartTooltipTitle>(
    () => dataIndex => {
      const timestamp = timestamps[dataIndex];
      if (timestamp == null) return undefined;
      return formatDate(timestamp);
    },
    [timestamps, formatDate],
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
    (range: AnalyticsChartRange) => {
      const portfolioRange = lineChartRangeToPortfolioRange(range);
      if (!portfolioRange || portfolioRange === selectedTimeRange) return;
      setHoveredBalance(null);
      dispatch(setSelectedTimeRange(portfolioRange));
      track("timeframe_clicked", { timeframe: portfolioRange });
    },
    [dispatch, selectedTimeRange],
  );

  const percentageValue = valueChange.percentage == null ? NaN : valueChange.percentage * 100;
  const mainUnitValue = new BigNumber(valueChange.value).shiftedBy(-fiatUnit.magnitude).toNumber();
  const variationText = discreet
    ? "***"
    : formatSignedFiatVariation(mainUnitValue, fiatUnit, locale);
  const rangeLabel = t(`assetDetail.balanceGraph.timeLabel.${selectedRange}`);

  return {
    header: {
      hoveredBalance,
      isBalanceAvailable,
      percentageValue,
      variationText,
      rangeLabel,
      discreet,
    },
    chart: {
      series,
      selectedRange,
      onRangeChange,
      ranges: ANALYTICS_CHART_RANGES.map(value => ({
        value,
        label: t(`common:time.${lineChartRangeToPortfolioRange(value) ?? "day"}`),
      })),
      isRangeValue: isAnalyticsChartRange,
      color: resolveLineChartColorFromPercentChange(
        valueChange.percentage == null ? undefined : percentageValue,
      ),
      isLoading: !isBalanceAvailable,
      height: DEFAULT_LINE_CHART_HEIGHT,
      formatValue,
      tooltipTitle,
      onScrubberPositionChange,
      showScrubberTooltip: true,
      showScrubberBeacons: false,
      showXAxis: false,
      showYAxis: false,
      xAxis: buildAnalyticsChartXAxisConfig({ timestamps, selectedRange, formatDate }),
      yAxis: buildAnalyticsChartYAxisConfig(),
      points: getExtremaPointMarkers(series),
      accessibilityLabel: t("assetDetail.balanceGraph.timeframeSelector"),
      testID: "analytics-chart",
    },
  };
}
