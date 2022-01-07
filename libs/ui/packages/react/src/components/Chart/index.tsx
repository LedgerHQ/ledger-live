import React, { useEffect, useMemo } from "react";
import { Line, defaults, ChartProps } from "react-chartjs-2";
import type { ScriptableContext } from "chart.js";
import Color from "color";
import { useTheme } from "styled-components";
import "chartjs-adapter-moment";

import type { Item, timeOptions } from "./types";
import { fontConfig, valueFormatter } from "./utils";

type LineProps = React.ComponentProps<typeof Line>;

export type Props = Omit<ChartProps, "type" | "data" | "options"> & {
  data: Array<Item>;
  color: string;
  variant?: "default" | "small";
  valueKey?: string;
  /*
   ** This prop is used to format the x-axis using time options from chart.js.
   ** See https://www.chartjs.org/docs/latest/axes/cartesian/time.html#time-units
   */
  timeOptions?: timeOptions;
};

/*
 ** @DEV: I'm sorry, I spent too much time to try to type scales. Types from chart.js
 ** are horrible. I hope someone in the future will have more luck than me.
 */
type GetConfigOutput = { gradient: { alpha: number }; scales: unknown };

/*
 ** Returns the correct config based on the variant
 */
const getConfig = (
  variant: NonNullable<Props["variant"]>,
  options: NonNullable<Pick<Props, "timeOptions">> & { gridColor: string },
): GetConfigOutput => {
  const config: { small: GetConfigOutput; default: GetConfigOutput } = {
    small: {
      gradient: { alpha: 0.3 },
      scales: { y: { display: false }, x: { display: false, type: "time" } },
    },
    default: {
      gradient: { alpha: 0.1 },
      scales: {
        y: {
          display: true,
          grid: {
            color: options.gridColor,
            borderDash: [4, 4],
            tickWidth: 0,
            tickLength: 18,

            // This is an hack to don't render a duplicate axis
            borderWidth: 0,
          },
          ticks: { callback: valueFormatter, labelOffset: -3 },
        },
        x: {
          display: true,
          grid: {
            color: options.gridColor,
            borderDash: [4, 4],
            tickWidth: 0,
            tickLength: 15,

            // Don't render a duplicate axis
            borderWidth: 0,
          },
          // always display first/last ticks
          bounds: "ticks",
          type: "time",
          // control how the tickers on the x-axis are formatted
          time: options.timeOptions,
        },
      },
    },
  };

  return config[variant];
};

const defaultValue: {
  variant: NonNullable<Props["variant"]>;
  valueKey: NonNullable<Props["valueKey"]>;
  timeOptions: NonNullable<Props["timeOptions"]>;
} = {
  variant: "default",
  valueKey: "value",
  timeOptions: { unit: "month", displayFormats: { month: "MMM." } },
};

/**
 * @remarks This component must have a parent that has only it as a child and it must be in relative position!
 * @privateRemarks Don't name this component "Chart", that will conflict with the Chart.js library cuz of the adapter
 */
export default ({
  data,
  color,
  variant = defaultValue.variant,
  valueKey = defaultValue.valueKey,
  timeOptions = defaultValue.timeOptions,
  ...chartProps
}: Props): JSX.Element => {
  const theme = useTheme();
  const config = useMemo(
    () => getConfig(variant, { gridColor: theme.colors.neutral.c40, timeOptions }),
    [variant, theme.colors.neutral.c40, timeOptions],
  );

  // inject default font configuration at mount
  useEffect(() => {
    defaults.font = fontConfig;
  }, []);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          borderColor: color,
          borderWidth: 2,
          fill: "start",
          backgroundColor: (context: ScriptableContext<"bar">) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            // This case happens on initial chart load
            if (!chartArea) return null;

            // Create gradient based on the props color
            const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height / 1.2);
            gradient.addColorStop(0, Color(color).alpha(config.gradient.alpha).string());
            gradient.addColorStop(1, Color(color).alpha(0.0).string());
            return gradient;
          },

          // prevent points rendering
          pointRadius: 0,
          pointHitRadius: 0,

          data: data.map(({ date: x, [`${valueKey}`]: y }) => ({ x, y })),
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, data, valueKey, variant],
  ) as unknown as LineProps["data"];

  const options: ChartProps["options"] = useMemo(
    () => ({
      // Responsive options use the parent element to create the canvas
      responsive: true,
      maintainAspectRatio: false,

      plugins: { tooltips: { enabled: false }, legend: { display: false } },
      animation: false,
      elements: {
        points: { radius: 0 },
        line: {
          // Bezier curve tension of the line. Set to 0 to draw straightlines.
          tension: 0.2,
        },
      },
      scales: config.scales,
    }),
    [config.scales],
  ) as unknown as LineProps["options"];

  // The redraw is needed to allow the chart to be updated with new value
  return <Line data={chartData} options={options} {...chartProps} redraw />;
};
