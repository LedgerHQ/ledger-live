import React, { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { Flex, GraphTabs, InfiniteLoader } from "../index";
import * as Animatable from "react-native-animatable";
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
  locale,
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
  locale: string;
  ranges: { label: string; value: string }[];
  yAxisFormatter: (value: number) => string;
  valueFormatter: (value: number) => string;
}) => {
  const { colors } = useTheme();

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex((r) => r.value === range);

  const setRange = useCallback(
    (index) => {
      if (isLoading) return;
      const newRange = ranges[index]?.value;
      if (range !== newRange) refreshChart({ range: newRange });
    },
    [isLoading, range, ranges, refreshChart],
  );

  const timeFormat = useMemo(() => {
    switch (ranges[activeRangeIndex].value) {
      case "24h":
        return { hour: "numeric", minute: "numeric" };
      case "7d":
        return { weekday: "short" };
      case "30d":
        return { month: "short", day: "numeric" };
      default:
        return { month: "short" };
    }
  }, [ranges, activeRangeIndex]);

  return (
    <Flex margin={margin} padding={6} borderRadius={2} bg={"neutral.c30"}>
      {Header}
      <Flex mt={6} height={100} alignItems="center" justifyContent="center">
        {chartData && chartData.length > 0 ? (
          <Animatable.View animation="fadeIn" duration={400} useNativeDriver>
            <Chart
              locale={locale}
              data={chartData}
              backgroundColor={colors.neutral.c30}
              color={currencyColor}
              timeFormat={timeFormat}
              valueKey={"value"}
              yAxisFormatter={yAxisFormatter}
              valueFormatter={valueFormatter}
              disableTooltips={false}
            />
          </Animatable.View>
        ) : (
          <InfiniteLoader size={32} />
        )}
      </Flex>
      <Flex mt={70}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          activeBg="neutral.c30"
          onChange={setRange}
          labels={rangesLabels}
        />
      </Flex>
      {Footer}
    </Flex>
  );
};

export default ChartCard;
