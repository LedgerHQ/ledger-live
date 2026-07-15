import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrendSection } from "LLM/components/TrendSection";
import { AnalyticsBalanceDisplay } from "LLM/features/Analytics/components/AnalyticsBalanceDisplay";
import { CHART_SECTION_TEST_IDS, type ChartSectionHeaderViewModel } from "./types";

type Props = Readonly<{
  viewModel: ChartSectionHeaderViewModel;
}>;

export function ChartSectionHeaderView({ viewModel }: Props) {
  const {
    hoveredBalance,
    isBalanceAvailable,
    percentageValue,
    variationText,
    rangeLabel,
    discreet,
  } = viewModel;

  return (
    <Box lx={headerStyle} testID={CHART_SECTION_TEST_IDS.header}>
      <AnalyticsBalanceDisplay hoveredValue={hoveredBalance} />
      {isBalanceAvailable && (
        <TrendSection
          percentage={percentageValue}
          formattedChange={variationText}
          timeLabel={rangeLabel}
          testID={CHART_SECTION_TEST_IDS.trend}
          trendSize="sm"
          showTrend={!discreet}
        />
      )}
    </Box>
  );
}

const headerStyle: LumenViewStyle = {
  gap: "s8",
  paddingHorizontal: "s16",
};
