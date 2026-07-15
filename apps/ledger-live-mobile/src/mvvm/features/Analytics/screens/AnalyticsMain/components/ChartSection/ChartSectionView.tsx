import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart } from "LLM/components/LineChart";
import type { LineChartProps } from "LLM/components/LineChart";
import type { AnalyticsChartRange } from "@ledgerhq/wallet-analytics";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import { CHART_SECTION_TEST_IDS, type ChartSectionViewModel } from "./types";

type Props = Readonly<{
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

export function ChartSectionView({ viewModel }: Props) {
  const { header, chart } = viewModel;

  return (
    <Box lx={containerStyle} testID={CHART_SECTION_TEST_IDS.root}>
      <ChartSectionHeaderView viewModel={header} />
      <Box lx={chartContainerStyle}>
        <ChartSectionChart {...chart} />
      </Box>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s24",
};

const chartContainerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};
