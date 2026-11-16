import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart } from "LLM/components/LineChart";
import type { LineChartProps } from "LLM/components/LineChart";
import type { AnalyticsChartRange } from "@ledgerhq/wallet-analytics";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import {
  CHART_SECTION_TEST_IDS,
  type ChartSectionSlots,
  type ChartSectionViewModel,
} from "./types";

type Props = ChartSectionSlots &
  Readonly<{
    viewModel: ChartSectionViewModel;
  }>;

/**
 * Memoized chart subtree. The header re-renders on every scrub frame; keeping
 * the chart props stable avoids resetting the Lumen scrubber mid-gesture.
 */
const ChartSectionChart = React.memo(function ChartSectionChart(
  props: LineChartProps<AnalyticsChartRange>,
) {
  return <LineChart {...props} />;
});

export function ChartSectionView({ viewModel, filters, headerContent, plotContent }: Props) {
  const { header, chart } = viewModel;

  return (
    <Box lx={containerStyle} testID={CHART_SECTION_TEST_IDS.root}>
      <Box lx={headerBlockStyle}>
        {headerContent ? (
          <Box lx={slotStyle}>{headerContent}</Box>
        ) : (
          <ChartSectionHeaderView viewModel={header} />
        )}
        {filters ? <Box lx={filtersSlotStyle}>{filters}</Box> : null}
      </Box>
      <Box lx={slotStyle}>
        <ChartSectionChart {...chart} plotContent={plotContent} />
      </Box>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s24",
};

const headerBlockStyle: LumenViewStyle = {
  gap: "s16",
};

const slotStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

// The chart extrema labels draw above the plot, so they need extra room under the filters.
const filtersSlotStyle: LumenViewStyle = {
  ...slotStyle,
  paddingBottom: "s8",
};
