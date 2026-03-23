import React, { memo, useMemo } from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import * as d3scale from "d3-scale";
import type { YearProjection } from "../../../utils/compoundInterest";

type Props = {
  data: YearProjection[];
  width: number;
  height: number;
  depositColor: string;
  rewardsColor: string;
};

const PADDING_INNER = 0.35;
const PADDING_OUTER = 0.15;
const BAR_RADIUS = 4;
const LABEL_FONT_SIZE = 12;
const LABEL_COLOR = "rgba(255, 255, 255, 0.5)";
const AXIS_LABEL_OFFSET = 20;

function formatCompactValue(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${value}`;
}

function SimulatorBarChart({ data, width, height, depositColor, rewardsColor }: Props) {
  const chartHeight = height - AXIS_LABEL_OFFSET;

  const xScale = useMemo(
    () =>
      d3scale
        .scaleBand<number>()
        .domain(data.map(d => d.year))
        .range([0, width])
        .paddingInner(PADDING_INNER)
        .paddingOuter(PADDING_OUTER),
    [data, width],
  );

  const maxTotal = useMemo(() => Math.max(...data.map(d => d.deposits + d.rewards)), [data]);

  const yScale = useMemo(
    () =>
      d3scale
        .scaleLinear()
        .domain([0, maxTotal * 1.1])
        .range([chartHeight, 0]),
    [maxTotal, chartHeight],
  );

  const bandwidth = xScale.bandwidth();

  return (
    <Svg width={width} height={height}>
      {/* Y-axis max label */}
      <SvgText
        x={width - 4}
        y={yScale(maxTotal) - 4}
        fontSize={LABEL_FONT_SIZE}
        fill={LABEL_COLOR}
        textAnchor="end"
        fontFamily="Inter"
      >
        {formatCompactValue(maxTotal)}
      </SvgText>

      {data.map(d => {
        const x = xScale(d.year) ?? 0;
        const total = d.deposits + d.rewards;

        const depositBarY = yScale(d.deposits);
        const depositBarHeight = chartHeight - depositBarY;

        const rewardsBarY = yScale(total);
        const rewardsBarHeight = depositBarY - rewardsBarY;

        return (
          <React.Fragment key={d.year}>
            {/* Deposit segment (bottom) */}
            <Rect
              x={x}
              y={depositBarY}
              width={bandwidth}
              height={Math.max(0, depositBarHeight)}
              fill={depositColor}
              rx={0}
              ry={0}
            />
            {/* Rewards segment (top, with rounded top corners) */}
            <Rect
              x={x}
              y={rewardsBarY}
              width={bandwidth}
              height={Math.max(0, rewardsBarHeight)}
              fill={rewardsColor}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
            />
          </React.Fragment>
        );
      })}

      {/* X-axis labels */}
      <SvgText
        x={(xScale(data[0]?.year) ?? 0) + bandwidth / 2}
        y={height - 2}
        fontSize={LABEL_FONT_SIZE}
        fill={LABEL_COLOR}
        textAnchor="middle"
        fontFamily="Inter"
      >
        1Y
      </SvgText>
      <SvgText
        x={(xScale(data[data.length - 1]?.year) ?? 0) + bandwidth / 2}
        y={height - 2}
        fontSize={LABEL_FONT_SIZE}
        fill={LABEL_COLOR}
        textAnchor="middle"
        fontFamily="Inter"
      >
        {data.length}Y
      </SvgText>
    </Svg>
  );
}

export default memo(SimulatorBarChart);
