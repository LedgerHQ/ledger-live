import React from "react";
import { AmountDisplay, Box, Button, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { TrendSection } from "LLM/components/TrendSection";
import { LineChart } from "LLM/components/LineChart";
import type {
  LineChartColor,
  LineChartPointMarker,
  LineChartScrubberPositionChange,
  LineChartSeries,
  LineChartTooltipTitle,
  LineChartValueFormatter,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "LLM/components/LineChart";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { RangeKey } from "../../utils/rangeMapping";

/** Figma asset-detail chart height (343 × 208). Width follows the screen inset. */
export const ASSET_DETAIL_CHART_HEIGHT = 208;

type Range = Readonly<{ label: string; value: RangeKey }>;

type Props = Readonly<{
  price: number;
  priceFormatter: (value: number) => FormattedValue;
  hasMarketData: boolean;
  priceChangePercentage: number;
  formattedPriceChange: string | undefined;
  timeLabel: string | undefined;
  ranges: Range[];
  selectedRange: RangeKey;
  onRangeChange: (value: RangeKey) => void;
  isRangeValue: (value: string) => value is RangeKey;
  showReceive: boolean;
  onReceivePress: () => void;
  isLoading: boolean;
  series: LineChartSeries[];
  chartColor: LineChartColor;
  points: LineChartPointMarker[];
  pointTooltipsOnly: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  onScrubberPositionChange: LineChartScrubberPositionChange;
  isScrubbing: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: LineChartXAxisConfig;
  yAxis: LineChartYAxisConfig;
}>;

type ChartProps = Readonly<{
  series: LineChartSeries[];
  selectedRange: RangeKey;
  onRangeChange: (value: RangeKey) => void;
  ranges: Range[];
  isRangeValue: (value: string) => value is RangeKey;
  chartColor: LineChartColor;
  isLoading: boolean;
  points: LineChartPointMarker[];
  pointTooltipsOnly: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  onScrubberPositionChange: LineChartScrubberPositionChange;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: LineChartXAxisConfig;
  yAxis: LineChartYAxisConfig;
  accessibilityLabel: string;
}>;

/**
 * Memoized chart subtree. The market-price header re-renders on every scrub
 * frame; wrapping the chart keeps its (already memoized) props stable so the
 * Lumen chart + scrubber are not re-rendered mid-gesture.
 */
const BalanceGraphChart = React.memo(function BalanceGraphChart({
  series,
  selectedRange,
  onRangeChange,
  ranges,
  isRangeValue,
  chartColor,
  isLoading,
  points,
  pointTooltipsOnly,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
  accessibilityLabel,
}: ChartProps) {
  return (
    <LineChart<RangeKey>
      series={series}
      selectedRange={selectedRange}
      onRangeChange={onRangeChange}
      ranges={ranges}
      isRangeValue={isRangeValue}
      color={chartColor}
      isLoading={isLoading}
      points={points}
      formatValue={formatValue}
      tooltipTitle={tooltipTitle}
      onScrubberPositionChange={onScrubberPositionChange}
      showScrubberTooltip
      showScrubberBeacons={false}
      pointTooltipsOnly={pointTooltipsOnly}
      showXAxis={showXAxis}
      showYAxis={showYAxis}
      xAxis={xAxis}
      yAxis={yAxis}
      accessibilityLabel={accessibilityLabel}
      testID={ASSET_DETAIL_TEST_IDS.chart}
      height={ASSET_DETAIL_CHART_HEIGHT}
    />
  );
});

export function BalanceGraphView({
  price,
  priceFormatter,
  hasMarketData,
  priceChangePercentage,
  formattedPriceChange,
  timeLabel,
  ranges,
  selectedRange,
  onRangeChange,
  isRangeValue,
  showReceive,
  onReceivePress,
  isLoading,
  series,
  chartColor,
  points,
  pointTooltipsOnly,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  isScrubbing,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceGraph} lx={containerStyle}>
      {isLoading && !hasMarketData ? (
        <Box lx={{ gap: "s16" }}>
          <Skeleton lx={{ height: "s12", width: "s128", borderRadius: "full" }} />
          <Skeleton lx={{ height: "s80", width: "s224", borderRadius: "md" }} />
        </Box>
      ) : (
        <Box lx={headerStyle}>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("assetDetail.balanceGraph.marketPrice")}
          </Text>

          {(hasMarketData || isScrubbing) && (
            <>
              <AmountDisplay
                value={price}
                formatter={priceFormatter}
                animate={!isScrubbing}
                size="md"
                testID={ASSET_DETAIL_TEST_IDS.marketPrice}
              />

              <TrendSection
                percentage={priceChangePercentage}
                formattedChange={formattedPriceChange}
                timeLabel={timeLabel}
              />
            </>
          )}
        </Box>
      )}

      <BalanceGraphChart
        series={series}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        ranges={ranges}
        isRangeValue={isRangeValue}
        chartColor={chartColor}
        isLoading={isLoading}
        points={points}
        pointTooltipsOnly={pointTooltipsOnly}
        formatValue={formatValue}
        tooltipTitle={tooltipTitle}
        onScrubberPositionChange={onScrubberPositionChange}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        xAxis={xAxis}
        yAxis={yAxis}
        accessibilityLabel={t("assetDetail.balanceGraph.timeframeSelector")}
      />

      {showReceive && (
        <Box lx={receiveContainerStyle}>
          <Button
            appearance="gray"
            size="lg"
            isFull
            icon={ArrowDown}
            onPress={onReceivePress}
            testID={ASSET_DETAIL_TEST_IDS.receiveButton}
          >
            {t("transfer.receive.title")}
          </Button>
        </Box>
      )}
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s24",
};

const headerStyle: LumenViewStyle = {
  gap: "s8",
};

const receiveContainerStyle: LumenViewStyle = {
  marginTop: "s8",
};
