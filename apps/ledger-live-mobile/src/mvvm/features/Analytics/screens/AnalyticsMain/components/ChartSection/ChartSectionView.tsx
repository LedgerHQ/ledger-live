import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart } from "LLM/components/LineChart";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import { CHART_SECTION_TEST_IDS, type ChartSectionViewModel } from "./types";

type Props = Readonly<{
  viewModel: ChartSectionViewModel;
}>;

export function ChartSectionView({ viewModel }: Props) {
  const { header, chart } = viewModel;

  return (
    <Box lx={containerStyle} testID={CHART_SECTION_TEST_IDS.root}>
      <ChartSectionHeaderView viewModel={header} />
      <Box lx={chartContainerStyle}>
        <LineChart {...chart} />
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
