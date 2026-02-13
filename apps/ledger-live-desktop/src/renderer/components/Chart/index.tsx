/* eslint-disable react/no-unused-prop-types */

/**
 *                                   Chart
 *                                   -----
 *
 *                                    XX
 *                                   XXXX
 *                          X       XX  X
 *                         XXXX    XX   X
 *                        XX  X  XX     X
 *                       X    XXXX       X     XX    X
 *                      XX     XX        X   XX XX  XX
 *                     XX                XX XX   XXXX
 *                                        XX
 *                                        XX
 *  Usage:
 *
 *    <Chart
 *      data={data}
 *      color="#5f8ced"   // Main color for line, gradient, etc.
 *      height={300}      // Fix height. Width is responsive to container.
 *    />
 *
 *    `data` looks like:
 *
 *     [
 *       { date: '2018-01-01', value: 10 },
 *       { date: '2018-01-02', value: 25 },
 *       { date: '2018-01-03', value: 50 },
 *     ]
 *
 */

import React, { useRef, useLayoutEffect, useState, useMemo } from "react";
import ChartJs, { ChartColor, ChartData, ChartOptions, ChartTooltipModel } from "chart.js";
import styled from "styled-components";
import Color from "color";
import useTheme from "~/renderer/hooks/useTheme";
import Tooltip from "./Tooltip";
import { Data, Item } from "./types";
import { startOfHour, startOfDay } from "@ledgerhq/live-countervalues/portfolio";
import { track } from "~/renderer/analytics/segment";

export enum GraphTrackingScreenName {
  Account = "Account",
  Asset = "Asset",
  Market = "Market",
  Portfolio = "Portfolio",
}

export type Props = {
  data: Data;
  magnitude: number;
  height?: number;
  tickXScale?: string;
  color?: string;
  hideAxis?: boolean;
  renderTooltip?: (data: Item) => React.ReactNode;
  renderTickY: (t: string | number) => string | number;
  valueKey?: "value" | "countervalue";
  suggestedMin?: number;
  suggestedMax?: number;
  screenName?: GraphTrackingScreenName;
};

const ChartContainer = styled.div.attrs<{
  height?: number;
}>(({ height }) => ({
  style: {
    height,
  },
}))<{
  height?: number;
}>`
  position: relative;
`;

export function genericBackgroundColor(color: string | undefined) {
  return ({ chart }: { chart?: ChartJs }): ChartColor => {
    const ctx = chart?.ctx;
    if (!ctx) return "";
    const gradient = ctx?.createLinearGradient(0, 0, 0, (chart.height || 0) / 1.2);
    gradient?.addColorStop(0, Color(color).alpha(0.4).toString());
    gradient?.addColorStop(1, Color(color).alpha(0.0).toString());
    return gradient;
  };
}

export default function Chart({
  magnitude,
  height,
  data,
  color,
  tickXScale,
  renderTickY,
  renderTooltip,
  valueKey = "value",
  suggestedMin,
  screenName,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJs | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const { colors } = useTheme();
  const [tooltip, setTooltip] = useState<ChartTooltipModel>();
  const valueKeyRef = useRef(valueKey);
  const generatedData = useMemo(() => {
    const chartData: ChartData = {
      datasets: [
        {
          label: "all accounts",
          borderColor: color,
          backgroundColor: genericBackgroundColor(color),
          pointRadius: 0,
          borderWidth: 2,
          data: data.map((d, i) => ({
            x:
              tickXScale === "week"
                ? new Date(d.date)
                : tickXScale === "day"
                  ? startOfHour(new Date(d.date))
                  : tickXScale === "minute"
                    ? new Date(new Date(d.date).getTime() - i * 5 * 60 * 1000)
                    : startOfDay(new Date(d.date)),
            y: d[valueKey],
          })),
        },
      ],
    };
    return chartData;
  }, [color, data, valueKey, tickXScale]);
  const generateOptions: ChartOptions = useMemo(
    () => ({
      animation: {
        duration: 0,
      },
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        enabled: false,
        intersect: false,
        mode: "index",
        custom: tooltip => setTooltip(tooltip),
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [
          {
            type: "time",
            gridLines: {
              display: false,
              color: colors.neutral.c30,
            },
            ticks: {
              fontColor: colors.neutral.c70,
              fontFamily: "Inter",
              maxTicksLimit: 7,
              maxRotation: 0.1,
              // trick to make the graph fit the whole canvas regardless of data
              minRotation: 0,
              padding: 12,
            },
            time: {
              unit: tickXScale === "day" ? "hour" : tickXScale === "minute" ? "minute" : "day",
              displayFormats: {
                quarter: "MMM YYYY",
                minute: "HH:mm",
              },
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: colors.neutral.c30,
              borderDash: [5, 5],
              drawTicks: false,
              drawBorder: false,
              zeroLineColor: colors.neutral.c30,
            },
            ticks: {
              suggestedMin: suggestedMin || 0,
              suggestedMax: suggestedMin || 10 ** Math.max(magnitude - 4, 1),
              maxTicksLimit: 4,
              fontColor: colors.neutral.c70,
              fontFamily: "Inter",
              padding: 10,
              callback: value => renderTickY(value),
            },
          },
        ],
      },
      layout: {
        padding: {
          left: 0,
          right: 10,
          // trick to make the graph fit the whole canvas regardless of data
          top: 0,
          bottom: 0,
        },
      },
    }),
    [colors.neutral.c30, colors.neutral.c70, tickXScale, magnitude, renderTickY, suggestedMin],
  );
  useLayoutEffect(() => {
    if (chartRef.current) {
      let shouldAnimate = false;
      if (valueKeyRef.current !== valueKey) {
        valueKeyRef.current = valueKey;
        shouldAnimate = true;
      }
      if (!chartRef.current.data.datasets || !generatedData.datasets) return;
      chartRef.current.data.datasets[0].data = generatedData.datasets[0].data;
      chartRef.current.options = generateOptions;
      chartRef.current.update({ duration: shouldAnimate ? 500 : 0 });
    } else if (canvasRef.current) {
      chartRef.current = new ChartJs(canvasRef.current, {
        type: "line",
        data: generatedData,
        options: generateOptions,
      });
    }
  }, [generateOptions, generatedData, valueKey]);

  const onMouseEnterGraph = () => {
    timeoutRef.current = setTimeout(() => {
      track("charthover_entered", {
        chart: screenName,
        page: screenName,
      });
    }, 2000);
  };

  const onMouseLeaveGraph = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <ChartContainer
      height={height}
      data-testid="chart-container"
      onMouseEnter={onMouseEnterGraph}
      onMouseLeave={onMouseLeaveGraph}
    >
      <canvas ref={canvasRef} />
      {tooltip && renderTooltip ? (
        <Tooltip tooltip={tooltip} renderTooltip={renderTooltip} color={color} data={data} />
      ) : null}
    </ChartContainer>
  );
}
