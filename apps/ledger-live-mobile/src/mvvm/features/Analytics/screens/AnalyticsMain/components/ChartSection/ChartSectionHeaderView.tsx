import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { TrendSection } from "LLM/components/TrendSection";
import { AnalyticsBalanceDisplay } from "LLM/features/Analytics/components/AnalyticsBalanceDisplay";
import { CHART_SECTION_TEST_IDS, type ChartSectionHeaderViewModel } from "./types";

type Props = Readonly<{
  viewModel: ChartSectionHeaderViewModel;
}>;

export function ChartSectionHeaderView({ viewModel }: Props) {
  const { t } = useTranslation();
  const {
    hoveredBalance,
    scrubDateLabel,
    isCountervalueComplete,
    isTrendComplete,
    isLoading,
    percentageValue,
    variationText,
    rangeLabel,
    discreet,
  } = viewModel;

  const isScrubbing = scrubDateLabel != null;

  return (
    <Box lx={headerStyle} testID={CHART_SECTION_TEST_IDS.header}>
      <Text
        typography="body2"
        lx={{ color: "muted" }}
        testID={CHART_SECTION_TEST_IDS.totalBalanceLabel}
      >
        {t("portfolio.totalBalance")}
      </Text>
      <AnalyticsBalanceDisplay hoveredValue={hoveredBalance} animate={!isScrubbing} />
      {isTrendComplete ? (
        <TrendSection
          percentage={percentageValue}
          formattedChange={variationText}
          timeLabel={scrubDateLabel ?? rangeLabel}
          testID={CHART_SECTION_TEST_IDS.trend}
          trendSize="sm"
          showTrend={!discreet}
        />
      ) : isLoading ? null : (
        <Text typography="body2" lx={{ color: "muted" }} testID={CHART_SECTION_TEST_IDS.trend}>
          -
        </Text>
      )}
    </Box>
  );
}

const headerStyle: LumenViewStyle = {
  gap: "s8",
  paddingHorizontal: "s16",
};
