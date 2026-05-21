import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  AmountDisplay,
  Box,
  Button,
  SegmentedControl,
  SegmentedControlButton,
  Skeleton,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { Trend } from "LLM/components/Trend";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Range = Readonly<{ label: string; value: string }>;

type Props = Readonly<{
  price: number;
  priceFormatter: (value: number) => FormattedValue;
  hasMarketData: boolean;
  priceChangePercentage: number;
  formattedPriceChange: string | undefined;
  rangeTimeLabel: string;
  ranges: Range[];
  selectedRange: string;
  onRangeChange: (value: string) => void;
  showReceive: boolean;
  onReceivePress: () => void;
  isLoading: boolean;
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
  showReceive,
  onReceivePress,
  isLoading,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceGraph} lx={containerStyle}>
      {/* Box 1 — Header: label + price + trend */}
      {isLoading && !hasMarketData ? (
        <Skeleton lx={{ height: "s56", width: "s256", borderRadius: "md" }} />
      ) : (
        <Box lx={headerStyle}>
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("assetDetail.balanceGraph.marketPrice")}
          </Text>

          {hasMarketData && (
            <>
              <AmountDisplay
                value={price}
                formatter={priceFormatter}
                testID={ASSET_DETAIL_TEST_IDS.marketPrice}
              />

              <Trend
                percentage={priceChangePercentage}
                formattedChange={formattedPriceChange}
                timeLabel={rangeTimeLabel}
              />
            </>
          )}
        </Box>
      )}

      {/* Box 2 — Chart placeholder */}
      <Box
        lx={chartPlaceholderLx}
        style={chartPlaceholderRaw}
        testID={ASSET_DETAIL_TEST_IDS.chartPlaceholder}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#898FBC" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#3F4156" stopOpacity="0.35" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#chartGradient)" />
        </Svg>
        <Text typography="body3" lx={{ color: "muted" }}>
          {t("assetDetail.balanceGraph.chartPlaceholder")}
        </Text>
      </Box>

      {/* Box 3 — Timeframe selector */}
      <SegmentedControl
        selectedValue={selectedRange}
        onSelectedChange={onRangeChange}
        appearance="background"
        tabLayout="fixed"
        accessibilityLabel={t("assetDetail.balanceGraph.timeframeSelector")}
      >
        {ranges.map(({ label, value }) => (
          <SegmentedControlButton key={value} value={value}>
            {label}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>

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

const chartPlaceholderLx: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: "md",
};

const chartPlaceholderRaw = { height: 203 } as const;

const receiveContainerStyle: LumenViewStyle = {
  marginTop: "s8",
};
