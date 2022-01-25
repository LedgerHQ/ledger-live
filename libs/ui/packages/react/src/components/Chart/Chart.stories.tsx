import React from "react";
import styled, { useTheme } from "styled-components";

import Chart from "./index";
import type { Props as ChartPreviewProps } from "./index";
import Flex from "../layout/Flex";
import Button from "../cta/Button";
import type { Item } from "./types";

function getRandomChartDate() {
  const fromTime = new Date("2020-09-01T01:57:45.271Z");
  const toTime = new Date("2021-02-12T01:57:45.271Z");
  return new Date(fromTime.getTime() + Math.random() * (toTime.getTime() - fromTime.getTime()));
}

function getRandomChartValue() {
  const min = 1_000;
  const max = 2_500_000;
  return Math.floor(Math.random() * (max - min) + min);
}

const generateData = () => {
  return new Array(50)
    .fill({})
    .map(() => ({ value: getRandomChartValue(), date: getRandomChartDate() } as Item))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default {
  title: "Charts/Chart",
  component: Chart,
  argTypes: {
    data: {
      control: false,
      description:
        "Date is the only accepted type on the x-axis. On the y-axis, number and string are accepted.",
    },
    color: {
      type: "string",
      control: "color",
      defaultValue: "#0EBDCD",
      description:
        "This property defines the color of the stroke and the color used to created the gradient. This property any color format.",
    },
    valueKey: {
      control: false,
      description:
        "This optional property is useful to override the key in charge of storing the value used on the x-axis.",
    },
    variant: {
      type: "enum",
      defaultValue: "default",
      description:
        "The small variant is used to display a gridless, tickerless chart. The default one is a full chart that allows more controls and optimisations.",
      options: ["default", "small"],
      control: false,
    },
    timeOptions: {
      type: "object",
      description:
        "This optional property is only used by the default variant to know how to format ticker on the x-axis. See https://www.chartjs.org/docs/latest/axes/cartesian/time.html#time-units.",
      control: { type: "object" },
      defaultValue: { unit: "month", displayFormats: { month: "MMM." } },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "This component chart componnet has two variants, the default and the small one. The small one is like a preview, it has no controls and allow less optimisations. The default one is a component that displays grid, axis, tickers and allow lot of customisation.",
      },
    },
  },
};

export const Default = ({ data: _, ...args }: ChartPreviewProps): JSX.Element => {
  const [data, setData] = React.useState(generateData());

  const handleClick = () => setData(generateData());

  return (
    <Flex alignItems="flex-start" flexDirection="column" rowGap="1.5rem">
      <Flex
        style={
          args.variant === "default"
            ? { position: "relative", width: "100%", aspectRatio: "2 / 1" }
            : {}
        }
      >
        <Chart {...args} data={data} />
      </Flex>
      <Button variant="main" outline onClick={handleClick}>
        Generate new data
      </Button>
    </Flex>
  );
};

const CardChart = styled.div`
  position: relative;
  width: 221px;
  height: 86px;
`;

export const Small = (args: ChartPreviewProps): JSX.Element => {
  const theme = useTheme();
  const [data, setData] = React.useState(generateData());

  const handleClick = () => setData(generateData());

  return (
    <Flex alignItems="flex-start" flexDirection="column" rowGap="1rem">
      <Flex flexWrap="wrap" rowGap="1.5rem" columnGap="2rem">
        <CardChart>
          <Chart id="static" variant="small" color={theme.colors.primary.c100} data={data} />
        </CardChart>
        <CardChart>
          <Chart id="dynamic" variant="small" color={args.color} data={data} />
        </CardChart>
      </Flex>
      <Button variant="main" outline onClick={handleClick}>
        Generate new data
      </Button>
    </Flex>
  );
};
