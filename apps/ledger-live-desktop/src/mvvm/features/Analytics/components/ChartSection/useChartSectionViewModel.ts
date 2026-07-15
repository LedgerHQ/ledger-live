import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { Portfolio } from "@ledgerhq/types-live";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import {
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartProps,
  type LineChartRange,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
} from "LLD/components/LineChart";
import { createSmallestUnitFiatLineChartValueFormatter } from "LLD/components/LineChart/utils/createFiatLineChartValueFormatter";
import { DEFAULT_LINE_CHART_HEIGHT } from "LLD/components/LineChart/constants";
import {
  buildLineChartBottomPaddedYAxisConfig,
  buildLineChartXAxisConfig,
} from "LLD/components/LineChart/utils/lineChartAxisConfig";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { setSelectedTimeRange } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { useAssetChartDateFormatter } from "LLD/features/AssetDetail/hooks/useAssetChartDateFormatter";
import {
  ANALYTICS_CHART_RANGES,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
} from "../../utils/portfolioRangeMapping";
import type { ChartSectionViewModelResult, ScrubSelection } from "./types";

type UseChartSectionViewModelProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Portfolio;
  isLoading: boolean;
}>;

export function useChartSectionViewModel({
  balanceInfo,
  portfolio,
  isLoading,
}: UseChartSectionViewModelProps): ChartSectionViewModelResult {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const fiatUnit = counterValue.units[0];
  const [scrubSelection, setScrubSelection] = useState<ScrubSelection | undefined>(undefined);

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

  const rangePercentageValue =
    balanceInfo.valueChange.percentage == null
      ? undefined
      : balanceInfo.valueChange.percentage * 100;

  const points = useMemo(() => getExtremaPointMarkers(series), [series]);

  const formatValue = useMemo(
    () => createSmallestUnitFiatLineChartValueFormatter(fiatUnit, locale, discreet),
    [fiatUnit, locale, discreet],
  );

  const formatDate = useAssetChartDateFormatter(selectedRange);

  const xAxis = useMemo(
    () => buildLineChartXAxisConfig({ timestamps, selectedRange, formatDate }),
    [timestamps, formatDate, selectedRange],
  );

  const yAxis = useMemo(() => buildLineChartBottomPaddedYAxisConfig(), []);

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) {
        setScrubSelection(undefined);
        return;
      }
      const value = prices[index];
      const timestamp = timestamps[index];
      setScrubSelection(
        Number.isFinite(value) && timestamp != null ? { balance: value, timestamp } : undefined,
      );
    },
    [prices, timestamps],
  );

  const onRangeChange = useCallback(
    (range: LineChartRange) => {
      const portfolioRange = lineChartRangeToPortfolioRange(range);
      if (!portfolioRange || portfolioRange === selectedTimeRange) return;
      setScrubSelection(undefined);
      dispatch(setSelectedTimeRange(portfolioRange));
      track("timeframe_clicked", { timeframe: portfolioRange });
    },
    [dispatch, selectedTimeRange],
  );

  const chart = useMemo(
    (): LineChartProps => ({
      series,
      selectedRange,
      onRangeChange,
      color: resolveLineChartColorFromPercentChange(rangePercentageValue),
      isLoading: !balanceInfo.isAvailable,
      height: DEFAULT_LINE_CHART_HEIGHT,
      formatValue,
      onScrubberPositionChange,
      showScrubberTooltip: false,
      showXAxis: false,
      showYAxis: false,
      xAxis,
      yAxis,
      points,
      ranges: ANALYTICS_CHART_RANGES,
    }),
    [
      series,
      selectedRange,
      onRangeChange,
      rangePercentageValue,
      balanceInfo.isAvailable,
      formatValue,
      onScrubberPositionChange,
      xAxis,
      yAxis,
      points,
    ],
  );

  return {
    header: {
      balanceInfo,
      scrubSelection,
      chartPrices: prices,
      isLoading,
    },
    chart,
  };
}
