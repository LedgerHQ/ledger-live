import { track } from "@shared/analytics";
import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { getScrubVariation } from "@ledgerhq/live-common/market/utils/scrubVariation";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation, useLocale } from "~/context/Locale";
import { formatPrice, formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  selectedTimeRangeSelector,
} from "~/reducers/settings";
import { setSelectedTimeRange } from "~/actions/settings";
import {
  DEFAULT_LINE_CHART_HEIGHT,
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
  type LineChartValueFormatter,
} from "LLM/components/LineChart";
import { buildChartDateFormatters } from "LLM/components/LineChart/utils/buildChartDateFormatters";
import {
  ANALYTICS_CHART_RANGES,
  isAnalyticsChartRange,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
  type AnalyticsChartRange,
} from "@ledgerhq/wallet-analytics";
import {
  buildAnalyticsChartXAxisConfig,
  buildAnalyticsChartYAxisConfig,
} from "LLM/features/Analytics/utils/chartAxisConfig";
import type { ChartSectionModelInput, ChartSectionViewModel } from "./types";

type ScrubSelection = Readonly<{ balance: number; timestamp: number }>;
type ScrubState = Readonly<{ contextKey: string | undefined; selection: ScrubSelection }>;

export function useChartSectionModel({
  prices,
  timestamps,
  valueChange,
  isVariationAvailable,
  isVariationLoading = false,
  isChartLoading,
  contextKey,
  balance,
}: ChartSectionModelInput): ChartSectionViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);

  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const fiatUnit = counterValue.units[0];
  const [scrub, setScrub] = useState<ScrubState | undefined>(undefined);
  const selection = scrub && scrub.contextKey === contextKey ? scrub.selection : undefined;
  const setSelection = useCallback(
    (next: ScrubSelection | undefined) =>
      setScrub(next ? { contextKey, selection: next } : undefined),
    [contextKey],
  );

  const series = useMemo<LineChartSeries[]>(
    () => [
      {
        id: "analytics-portfolio-balance",
        data: [...prices],
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

  const dateFormatters = useMemo(() => buildChartDateFormatters(locale), [locale]);

  const formatDate = useCallback(
    (timestamp: number) => dateFormatters.formatAxisDate(timestamp, selectedRange),
    [dateFormatters, selectedRange],
  );

  const scrubDateLabel =
    selection != null
      ? dateFormatters.formatScrubHeaderDate(selection.timestamp, selectedRange)
      : undefined;
  const hoveredBalance = selection?.balance ?? null;

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) {
        setSelection(undefined);
        return;
      }
      const value = prices[index];
      const timestamp = timestamps[index];
      setSelection(
        Number.isFinite(value) && timestamp != null ? { balance: value, timestamp } : undefined,
      );
    },
    [prices, timestamps, setSelection],
  );

  const onRangeChange = useCallback(
    (range: AnalyticsChartRange) => {
      const portfolioRange = lineChartRangeToPortfolioRange(range);
      if (!portfolioRange || portfolioRange === selectedTimeRange) return;
      setSelection(undefined);
      dispatch(setSelectedTimeRange(portfolioRange));
      track("timeframe_clicked", { timeframe: portfolioRange });
    },
    [dispatch, selectedTimeRange, setSelection],
  );

  const rangePercentageValue = valueChange.percentage == null ? NaN : valueChange.percentage * 100;
  const scrubVariation = useMemo(() => {
    if (selection == null) return undefined;
    const baselinePrice = prices[0];
    if (!Number.isFinite(baselinePrice)) return undefined;
    return getScrubVariation(baselinePrice, selection.balance, {
      percentageUnit: "percentPoints",
    });
  }, [selection, prices]);

  const percentageValue = scrubVariation?.percentage ?? rangePercentageValue;

  const rangeVariationText = useMemo(() => {
    if (discreet) return "***";
    const mainUnitValue = new BigNumber(valueChange.value)
      .shiftedBy(-fiatUnit.magnitude)
      .toNumber();
    return formatSignedFiatVariation(mainUnitValue, fiatUnit, locale);
  }, [discreet, valueChange.value, fiatUnit, locale]);

  const variationText = useMemo(() => {
    if (scrubVariation == null) return rangeVariationText;
    if (discreet) return "***";
    const mainUnitValue = new BigNumber(scrubVariation.variationFiat)
      .shiftedBy(-fiatUnit.magnitude)
      .toNumber();
    return formatSignedFiatVariation(mainUnitValue, fiatUnit, locale);
  }, [scrubVariation, rangeVariationText, discreet, fiatUnit, locale]);

  const rangeLabel = t(`assetDetail.balanceGraph.timeLabel.${selectedRange}`);

  const chart = useMemo(
    (): ChartSectionViewModel["chart"] => ({
      series,
      selectedRange,
      onRangeChange,
      ranges: ANALYTICS_CHART_RANGES.map(value => ({
        value,
        label: t(`common:time.${lineChartRangeToPortfolioRange(value) ?? "day"}`),
      })),
      isRangeValue: isAnalyticsChartRange,
      color: resolveLineChartColorFromPercentChange(
        valueChange.percentage == null ? undefined : rangePercentageValue,
      ),
      isLoading: isChartLoading,
      height: DEFAULT_LINE_CHART_HEIGHT,
      formatValue,
      onScrubberPositionChange,
      showScrubberTooltip: false,
      showScrubberBeacons: false,
      showXAxis: false,
      showYAxis: false,
      xAxis: buildAnalyticsChartXAxisConfig({
        timestamps: [...timestamps],
        selectedRange,
        formatDate,
      }),
      yAxis: buildAnalyticsChartYAxisConfig(),
      points: getExtremaPointMarkers(series),
      accessibilityLabel: t("assetDetail.balanceGraph.timeframeSelector"),
      testID: "analytics-chart",
    }),
    [
      series,
      selectedRange,
      onRangeChange,
      t,
      valueChange.percentage,
      rangePercentageValue,
      isChartLoading,
      formatValue,
      onScrubberPositionChange,
      timestamps,
      formatDate,
    ],
  );

  return {
    header: {
      hoveredBalance,
      scrubDateLabel,
      isVariationAvailable,
      isVariationLoading,
      percentageValue,
      variationText,
      rangeLabel,
      discreet,
      balance,
    },
    chart,
  };
}
