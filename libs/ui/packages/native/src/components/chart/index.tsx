import React, { useMemo, useCallback } from "react";
import { useTheme } from "styled-components/native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";

import { Flex } from "../index";
import type { Item } from "./types";

import { hex } from "../../styles/helpers";

const sortByDate = (a: Item, b: Item): -1 | 0 | 1 => {
  if (a.date.getTime() < b.date.getTime()) return -1;
  if (a.date.getTime() > b.date.getTime()) return 1;
  return 0;
};

export type ChartProps = {
  data: Array<Item>;
  backgroundColor: string;
  color: string;
  /* This prop is used to override the key that store the data */
  valueKey?: string;
  height?: number;
  xAxisFormatter?: (timestamp: number) => string;
  yAxisFormatter: (n: number) => string;
  valueFormatter: (n: number) => string;
  disableTooltips: boolean;
};

const Chart = ({
  data,
  backgroundColor,
  color,
  yAxisFormatter,
  valueFormatter,
  valueKey = "value",
  height = 200,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  xAxisFormatter = (timestamp: number): string => `${new Date(timestamp).toLocaleDateString()}`,
  disableTooltips = false,
}: ChartProps): JSX.Element => {
  const theme = useTheme();
  const sortData = useMemo(() => data.sort(sortByDate), [data]);

  const labelFormatted = useCallback(
    ({ datum }: any) => {
      const valueFormatted = valueFormatter(datum[valueKey]);
      return valueFormatted === "-" ? "0" : valueFormatted;
    },
    [valueKey, valueFormatter],
  );

  const domainValues = useMemo(() => {
    const counterValues = data.map((d) => d[valueKey]);

    return {
      min: Math.min(...counterValues) * 0.8, // 0.8 So the minimum value of the yAxis is a bit smaller than the min value displayed
      max: Math.max(...counterValues) * 1.2, // 1.2 So the maximum value of the yAxis is a bit bigger than the max value displayed
    };
  }, [data, valueKey]);

  const yAxisStyle = useMemo(
    () => ({
      grid: {
        stroke: theme.colors.neutral.c40,
        strokeDasharray: "4 4",
      },
      axisLabel: { display: "none" },
      axis: { display: "none" },
      ticks: { display: "none" },
      tickLabels: {
        fill: theme.colors.neutral.c80,
        fontSize: 12,
      },
    }),
    [theme],
  );

  const xAxisStyle = useMemo(
    () => ({
      axis: {
        stroke: theme.colors.neutral.c40,
        strokeDasharray: "4 4",
      },
      tickLabels: {
        fill: theme.colors.neutral.c80,
        fontSize: 12,
      },
      grid: { display: "none" },
    }),
    [theme],
  );

  return (
    <Flex justifyContent="center" alignItems="center">
      <VictoryChart
        scale={{ x: "time" }}
        height={height}
        domainPadding={{ y: 5 }}
        padding={{ top: 30, left: 60, right: 35, bottom: 35 }}
        maxDomain={{ y: domainValues.max }}
        minDomain={{ y: domainValues.min }}
        containerComponent={
          <VictoryVoronoiContainer
            // @ts-expect-error disable this error for the sake of the monorepo
            disable={disableTooltips}
            voronoiBlacklist={["victory-area"]}
            labels={labelFormatted}
            labelComponent={
              <VictoryTooltip
                centerOffset={{ y: -10 }}
                renderInPortal={false}
                constrainToVisibleArea
                style={{
                  fill: color,
                }}
                flyoutPadding={7}
                flyoutStyle={{
                  fill: backgroundColor,
                  stroke: color,
                }}
              />
            }
          />
        }
      >
        {/* y-axis */}
        <VictoryAxis dependentAxis crossAxis tickFormat={yAxisFormatter} style={yAxisStyle} />

        {/* x-axis */}
        <VictoryAxis crossAxis={false} tickFormat={xAxisFormatter} style={xAxisStyle} />

        {/* gradient area */}
        <Defs>
          <LinearGradient id="chartGradient" x1="0.5" x2="0.5" y1="0" y2="1">
            <Stop stopColor={hex(color)} stopOpacity="0.15" />
            <Stop offset="1" stopColor={hex(theme.colors.neutral.c00)} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <VictoryArea
          name="victory-area"
          data={sortData}
          interpolation="monotoneX"
          sortKey="date"
          x="date"
          y={valueKey}
          style={{ data: { fill: `url(#chartGradient)` } }}
          standalone={false}
        />

        {/* data line */}
        <VictoryLine
          data={sortData}
          interpolation="monotoneX"
          x="date"
          y={valueKey}
          style={{ data: { stroke: color } }}
        />
      </VictoryChart>
    </Flex>
  );
};

export default Chart;
