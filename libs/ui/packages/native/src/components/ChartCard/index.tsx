import React, { useCallback } from "react";
import { useTheme } from "styled-components/native";
import { Flex, GraphTabs, InfiniteLoader, Transitions } from "../index";
import Chart from "../chart";

const ChartCard = ({
  Header,
  Footer,
  range,
  isLoading,
  refreshChart,
  chartData,
  currencyColor,
  margin = 0,
  xAxisFormatter,
  ranges,
  yAxisFormatter,
  valueFormatter,
}: {
  Header?: React.ReactNode;
  Footer?: React.ReactNode;
  range: string;
  isLoading?: boolean;
  refreshChart: (request: any) => void;
  chartData: any;
  currencyColor: string;
  margin: number;
  xAxisFormatter?: (value: number) => string;
  ranges: { label: string; value: string }[];
  yAxisFormatter: (value: number) => string;
  valueFormatter: (value: number) => string;
}) => {
  const { colors } = useTheme();

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex((r) => r.value === range);

  const setRange = useCallback(
    (index: number) => {
      if (isLoading) return;
      const newRange = ranges[index]?.value;
      if (range !== newRange) refreshChart({ range: newRange });
    },
    [isLoading, range, ranges, refreshChart],
  );

  return (
    <Flex margin={margin} padding={6} borderRadius={2} bg={"neutral.c30"}>
      {Header}
      <Flex mt={6} height={100} alignItems="center" justifyContent="center">
        {chartData && chartData.length > 0 ? (
          <Transitions.Fade status="entering" duration={400}>
            <Chart
              data={chartData}
              backgroundColor={colors.neutral.c30}
              color={currencyColor}
              valueKey={"value"}
              xAxisFormatter={xAxisFormatter}
              yAxisFormatter={yAxisFormatter}
              valueFormatter={valueFormatter}
              disableTooltips={false}
            />
          </Transitions.Fade>
        ) : (
          <InfiniteLoader size={32} />
        )}
      </Flex>
      <Flex mt={70}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          activeBg={currencyColor}
          activeColor="neutral.c30"
          onChange={setRange}
          labels={rangesLabels}
        />
      </Flex>
      {Footer}
    </Flex>
  );
};

export default ChartCard;
