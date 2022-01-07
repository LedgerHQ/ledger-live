import React, { useMemo } from "react";
import styled, { useTheme } from "styled-components/native";
import moment from "moment";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryScatter,
} from "victory-native";

import { hex } from "../../styles/helpers";
import Flex from "../Layout/Flex";
import type { Item } from "./types";

const Container = styled(Flex)`
  background-color: ${(p) => p.theme.colors.background.main};
`;

const sortByDate = (a: Item, b: Item): -1 | 0 | 1 => {
  if (a.date.getTime() < b.date.getTime()) return -1;
  if (a.date.getTime() > b.date.getTime()) return 1;
  return 0;
};

export type ChartProps = {
  data: Array<Item>;
  color: string;
  /*
   ** This prop is used to format the x-axis using time options from moment format
   ** See https://momentjs.com/docs/#/displaying/format/
   */
  tickFormat?: string;
  /* This prop is used to override the key that store the data */
  valueKey?: string;
  height?: number;
};

const Chart = ({
  data,
  color,
  tickFormat = "MMM",
  valueKey = "value",
  height = 191,
}: ChartProps): JSX.Element => {
  const theme = useTheme();
  const sortData = useMemo(() => data.sort(sortByDate), [data]);

  return (
    <Container>
      <VictoryChart
        scale={{ x: "time" }}
        height={height}
        domainPadding={{ x: [0, 5], y: [30, 10] }}
      >
        {/* y-axis */}
        <VictoryAxis
          dependentAxis
          crossAxis
          style={{
            grid: {
              stroke: theme.colors.neutral.c40,
              strokeDasharray: "4 4",
            },
            axisLabel: { display: "none" },
            axis: { display: "none" },
            ticks: { display: "none" },
            tickLabels: { display: "none" },
          }}
        />

        {/* x-axis */}
        <VictoryAxis
          crossAxis={false}
          tickFormat={(timestamp: string) => moment(timestamp).format(tickFormat)}
          style={{
            axis: {
              stroke: theme.colors.neutral.c40,
              strokeDasharray: "4 4",
            },
            tickLabels: {
              fill: theme.colors.neutral.c80,
              fontSize: 12,
              lineHeight: 14.52,
            },
            grid: { display: "none" },
          }}
        />

        {/* gradient area */}
        <Defs>
          <LinearGradient id="chartGradient" x1="0.5" x2="0.5" y1="0" y2="1">
            <Stop stopColor={hex(color)} stopOpacity="0.11" />
            <Stop offset="1" stopColor={hex(theme.colors.neutral.c00)} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <VictoryArea
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

        {/* Rendered point */}
        <VictoryScatter
          style={{
            data: {
              stroke: color,
              strokeWidth: 3,
              fill: theme.colors.background.main,
            },
          }}
          size={5}
          data={[sortData[sortData.length - 1]]}
          x="date"
          y={valueKey}
        />
      </VictoryChart>
    </Container>
  );
};

export default Chart;
