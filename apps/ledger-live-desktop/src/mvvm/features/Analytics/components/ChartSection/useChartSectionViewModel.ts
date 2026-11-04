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
import { track } from "@shared/analytics";
import { useAssetChartDateFormatter } from "LLD/features/AssetDetail/hooks/useAssetChartDateFormatter";
import {
  ANALYTICS_CHART_RANGES,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
} from "../../utils/portfolioRangeMapping";
import type { ChartSectionViewModelResult, ScrubSelection } from "./types";

type UseChartSectionViewModelProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Pick<Portfolio, "balanceHistory">;
  isLoading: boolean;
  contextKey?: string;
  isChartLoading?: boolean;
  variationAvailable?: boolean;
  isVariationLoading?: boolean;
}>;

export function useChartSectionViewModel({
  balanceInfo,
  portfolio,
  isLoading,
  isChartLoading,
  variationAvailable,
  isVariationLoading,
  contextKey,
}: UseChartSectionViewModelProps): ChartSectionViewModelResult {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const fiatUnit = counterValue.units[0];
  const [scrub, setScrub] = useState<{ key?: string; selection?: ScrubSelection }>({
    key: contextKey,
  });
  const scrubSelection = scrub.key === contextKey ? scrub.selection : undefined;
  if (scrub.key !== contextKey) setScrub({ key: contextKey });

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
        setScrub({ key: contextKey });
        return;
      }
      const value = prices[index];
      const timestamp = timestamps[index];
      setScrub({
        key: contextKey,
        selection:
          Number.isFinite(value) && timestamp != null ? { balance: value, timestamp } : undefined,
      });
    },
    [prices, timestamps, contextKey],
  );

  const onRangeChange = useCallback(
    (range: LineChartRange) => {
      const portfolioRange = lineChartRangeToPortfolioRange(range);
      if (!portfolioRange || portfolioRange === selectedTimeRange) return;
      setScrub({ key: contextKey });
      dispatch(setSelectedTimeRange(portfolioRange));
      track("timeframe_clicked", { timeframe: portfolioRange });
    },
    [dispatch, selectedTimeRange, contextKey],
  );

  const chart = useMemo(
    (): LineChartProps => ({
      series,
      selectedRange,
      onRangeChange,
      color: resolveLineChartColorFromPercentChange(rangePercentageValue),
      isLoading: isChartLoading ?? !balanceInfo.isAvailable,
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
      isChartLoading,
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
      variationAvailable,
      isVariationLoading,
    },
    chart,
  };
}
