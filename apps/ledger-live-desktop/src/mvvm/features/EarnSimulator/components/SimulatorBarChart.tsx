import React, { memo, useCallback, useMemo, useState } from "react";
import * as d3scale from "d3-scale";
import type { YearProjection } from "../utils/compoundInterest";

type Props = {
  data: YearProjection[];
  width: number;
  height: number;
  depositColor: string;
  rewardsColor: string;
};

type TooltipState = {
  year: number;
  segment: "deposits" | "rewards";
  value: number;
  x: number;
  y: number;
} | null;

const PADDING_INNER = 0.35;
const PADDING_OUTER = 0.15;
const BAR_RADIUS = 4;
const LABEL_FONT_SIZE = 12;
const LABEL_COLOR = "rgba(255, 255, 255, 0.5)";
const TOP_PADDING = 16;
const AXIS_LABEL_OFFSET = 20;
const HIT_SLOP_TOP = 20;
const TOOLTIP_WIDTH = 90;
const TOOLTIP_HEIGHT = 28;
const TOOLTIP_TAIL_SIZE = 6;
const TOOLTIP_BG = "rgba(255, 255, 255, 0.95)";

function formatCompactValue(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${value}`;
}

function formatTooltipValue(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0 || w <= 0) return "";
  const cr = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + cr}`,
    `Q${x},${y} ${x + cr},${y}`,
    `H${x + w - cr}`,
    `Q${x + w},${y} ${x + w},${y + cr}`,
    `V${y + h}`,
    `Z`,
  ].join(" ");
}

function TooltipBubble({ tooltip, width }: { tooltip: NonNullable<TooltipState>; width: number }) {
  const clampedLeft = Math.max(0, Math.min(tooltip.x - TOOLTIP_WIDTH / 2, width - TOOLTIP_WIDTH));
  const tailLeft = tooltip.x - clampedLeft - TOOLTIP_TAIL_SIZE;

  return (
    <div
      className="absolute"
      style={{
        left: clampedLeft,
        top: Math.max(0, tooltip.y - TOOLTIP_HEIGHT - TOOLTIP_TAIL_SIZE - 2),
        width: TOOLTIP_WIDTH,
      }}
    >
      <div
        className="flex items-center justify-center rounded-md text-xs font-semibold"
        style={{
          width: TOOLTIP_WIDTH,
          height: TOOLTIP_HEIGHT,
          backgroundColor: TOOLTIP_BG,
          color: "#131214",
        }}
      >
        {formatTooltipValue(tooltip.value)}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          marginLeft: tailLeft,
          borderLeft: `${TOOLTIP_TAIL_SIZE}px solid transparent`,
          borderRight: `${TOOLTIP_TAIL_SIZE}px solid transparent`,
          borderTop: `${TOOLTIP_TAIL_SIZE}px solid ${TOOLTIP_BG}`,
        }}
      />
    </div>
  );
}

function SimulatorBarChart({ data, width, height, depositColor, rewardsColor }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
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

  const maxTotal = useMemo(() => Math.max(...data.map(d => d.deposits + d.rewards), 0), [data]);

  const yScale = useMemo(
    () =>
      d3scale
        .scaleLinear()
        .domain([0, maxTotal > 0 ? maxTotal * 1.1 : 1])
        .range([chartHeight, TOP_PADDING]),
    [maxTotal, chartHeight],
  );

  const bandwidth = xScale.bandwidth();

  const handleBarClick = useCallback(
    (year: number, segment: "deposits" | "rewards", value: number, barX: number, barY: number) => {
      setTooltip(prev => {
        if (prev?.year === year && prev?.segment === segment) return null;
        return { year, segment, value, x: barX + bandwidth / 2, y: barY };
      });
    },
    [bandwidth],
  );

  const dismissTooltip = useCallback(() => setTooltip(null), []);

  return (
    <div className="relative overflow-visible">
      <svg width={width} height={height} overflow="visible" onClick={dismissTooltip}>
        {maxTotal > 0 && (
          <text
            x={width - 4}
            y={yScale(maxTotal) - 4}
            fontSize={LABEL_FONT_SIZE}
            fill={LABEL_COLOR}
            textAnchor="end"
            fontFamily="Inter"
          >
            {formatCompactValue(maxTotal)}
          </text>
        )}

        {data.map(d => {
          const x = xScale(d.year) ?? 0;
          const total = d.deposits + d.rewards;

          const depositBarY = yScale(d.deposits);
          const depositBarHeight = chartHeight - depositBarY;

          const rewardsBarY = yScale(total);
          const rewardsBarHeight = depositBarY - rewardsBarY;

          return (
            <g key={d.year}>
              {depositBarHeight > 0 && (
                <rect
                  x={x}
                  y={depositBarY}
                  width={bandwidth}
                  height={depositBarHeight}
                  fill={depositColor}
                  className="cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    handleBarClick(d.year, "deposits", d.deposits, x, depositBarY);
                  }}
                />
              )}
              {rewardsBarHeight > 0 && (
                <>
                  <rect
                    x={x}
                    y={Math.max(0, rewardsBarY - HIT_SLOP_TOP)}
                    width={bandwidth}
                    height={Math.min(HIT_SLOP_TOP, rewardsBarY)}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      handleBarClick(d.year, "rewards", d.rewards, x, rewardsBarY);
                    }}
                  />
                  <path
                    d={roundedTopRect(x, rewardsBarY, bandwidth, rewardsBarHeight, BAR_RADIUS)}
                    fill={rewardsColor}
                    className="cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      handleBarClick(d.year, "rewards", d.rewards, x, rewardsBarY);
                    }}
                  />
                </>
              )}
            </g>
          );
        })}

        <text
          x={(xScale(data[0]?.year) ?? 0) + bandwidth / 2}
          y={height - 2}
          fontSize={LABEL_FONT_SIZE}
          fill={LABEL_COLOR}
          textAnchor="middle"
          fontFamily="Inter"
        >
          1Y
        </text>
        <text
          x={(xScale(data[data.length - 1]?.year) ?? 0) + bandwidth / 2}
          y={height - 2}
          fontSize={LABEL_FONT_SIZE}
          fill={LABEL_COLOR}
          textAnchor="middle"
          fontFamily="Inter"
        >
          {data.length}Y
        </text>
      </svg>

      {tooltip && <TooltipBubble tooltip={tooltip} width={width} />}
    </div>
  );
}

export default memo(SimulatorBarChart);
