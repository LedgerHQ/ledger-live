import React from "react";
import { useTheme } from "styled-components/native";

import Chart from "../../../src/components/chart";
import Flex from "../../../src/components/Layout/Flex";
import type { Item } from "../../../src/components/chart/types";

export default {
  title: "Chart",
  component: Chart,
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

export const ChartDefault = (args: typeof ChartDefaultArgs): JSX.Element => {
  const theme = useTheme();

  return (
    <Flex alignItems="flex-start" flexDirection="column">
      <Chart
        data={generateData()}
        backgroundColor={args.backgroundColor ?? theme.colors.neutral.c30}
        color={args.color ?? theme.colors.primary.c100}
        valueKey={args.valueKey}
        yAxisFormatter={(value) => value.toString()}
        valueFormatter={(value) => value.toString()}
        disableTooltips={args.disableTooltips}
      />
    </Flex>
  );
};
ChartDefault.storyName = "Chart";
const ChartDefaultArgs = {
  backgroundColor: undefined,
  color: undefined,
  valueKey: "value",
  disableTooltips: false,
};
ChartDefault.args = ChartDefaultArgs;
ChartDefault.argTypes = {
  backgroundColor: {
    control: { type: "color" },
  },
  color: {
    control: { type: "color" },
  },
};
