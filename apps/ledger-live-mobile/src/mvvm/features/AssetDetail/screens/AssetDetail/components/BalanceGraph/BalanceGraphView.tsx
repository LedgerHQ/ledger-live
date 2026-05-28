import React from "react";
import { AmountDisplay, Box, Button, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { TrendSection } from "LLM/components/TrendSection";
import { LineChart } from "LLM/components/LineChart";
import type { LineChartColor, LineChartSeries } from "LLM/components/LineChart";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { RangeKey } from "../../utils/rangeMapping";

type Range = Readonly<{ label: string; value: RangeKey }>;

type Props = Readonly<{
  price: number;
  priceFormatter: (value: number) => FormattedValue;
  hasMarketData: boolean;
  priceChangePercentage: number;
  formattedPriceChange: string | undefined;
  rangeTimeLabel: string;
  ranges: Range[];
  selectedRange: RangeKey;
  onRangeChange: (value: RangeKey) => void;
  isRangeValue: (value: string) => value is RangeKey;
  showReceive: boolean;
  onReceivePress: () => void;
  isLoading: boolean;
  series: LineChartSeries[];
  chartColor: LineChartColor;
}>;

export function BalanceGraphView({
  price,
  priceFormatter,
  hasMarketData,
  priceChangePercentage,
  formattedPriceChange,
  rangeTimeLabel,
  ranges,
  selectedRange,
  onRangeChange,
  isRangeValue,
  showReceive,
  onReceivePress,
  isLoading,
  series,
  chartColor,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceGraph} lx={containerStyle}>
      {isLoading && !hasMarketData ? (
        <Skeleton lx={{ height: "s56", width: "s256", borderRadius: "md" }} />
      ) : (
        <Box lx={headerStyle}>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("assetDetail.balanceGraph.marketPrice")}
          </Text>

          {hasMarketData && (
            <>
              <AmountDisplay
                value={price}
                formatter={priceFormatter}
                testID={ASSET_DETAIL_TEST_IDS.marketPrice}
              />

              <TrendSection
                percentage={priceChangePercentage}
                formattedChange={formattedPriceChange}
                timeLabel={rangeTimeLabel}
              />
            </>
          )}
        </Box>
      )}

      <LineChart<RangeKey>
        series={series}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        ranges={ranges}
        isRangeValue={isRangeValue}
        color={chartColor}
        isLoading={isLoading}
        accessibilityLabel={t("assetDetail.balanceGraph.timeframeSelector")}
        testID={ASSET_DETAIL_TEST_IDS.chart}
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
  gap: "s16",
};

const headerStyle: LumenViewStyle = {
  gap: "s8",
};

const receiveContainerStyle: LumenViewStyle = {
  marginTop: "s8",
};
