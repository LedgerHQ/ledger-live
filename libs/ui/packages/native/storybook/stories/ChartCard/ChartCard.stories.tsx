import React, { useCallback, useState } from "react";
import { useTheme } from "styled-components/native";

import ChartCard from "../../../src/components/ChartCard";
import Flex from "../../../src/components/Layout/Flex";
import type { Item } from "../../../src/components/chart/types";

export default {
  title: "ChartCard",
  component: ChartCard,
};

function getRandomChartDate() {
  const fromTime = new Date("2020-09-01T01:57:45.271Z");
  const toTime = new Date("2021-02-12T01:57:45.271Z");
  return new Date(fromTime.getTime() + Math.random() * (toTime.getTime() - fromTime.getTime()));
}

function getRandomChartValue() {
  const min = 1000;
  const max = 2500000;
  return Math.floor(Math.random() * (max - min) + min);
}

const generateData = () => {
  return new Array(20)
    .fill({})
    .map(() => ({ value: getRandomChartValue(), date: getRandomChartDate() } as Item))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const ranges = [
  { label: "1Y", value: "1y" },
  { label: "30D", value: "30d" },
  { label: "7D", value: "7d" },
  { label: "24H", value: "24h" },
];

export const ChartCardDefault = (args: typeof ChartCardDefaultArgs): JSX.Element => {
  const theme = useTheme();

  const [rangeRequest, setRangeRequest] = useState("24h");

  const refreshChart = useCallback(
    (request) => {
      if (request && request.range) {
        const { range } = request;
        setRangeRequest(range);
        generateData();
      }
    },
    [setRangeRequest],
  );

  return (
    <Flex alignItems="flex-start" flexDirection="column">
      <ChartCard
        chartData={generateData()}
        range={rangeRequest}
        ranges={ranges}
        refreshChart={refreshChart}
        isLoading={args.isLoading}
        currencyColor={args.currencyColor ?? theme.colors.primary.c100}
        margin={args.margin}
        yAxisFormatter={(v) => v.toString()}
        valueFormatter={(v) => v.toString()}
      />
    </Flex>
  );
};
ChartCardDefault.storyName = "ChartCard";
const ChartCardDefaultArgs = {
  isLoading: false,
  currencyColor: undefined,
  margin: 0,
};
ChartCardDefault.args = ChartCardDefaultArgs;
ChartCardDefault.argTypes = {
  currencyColor: {
    control: { type: "color" },
  },
};
