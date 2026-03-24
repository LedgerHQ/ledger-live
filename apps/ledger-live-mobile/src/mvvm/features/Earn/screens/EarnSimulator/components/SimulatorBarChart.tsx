import React, { memo, useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Path, Text as SvgText } from "react-native-svg";
import * as d3scale from "d3-scale";
import { Text } from "@ledgerhq/native-ui";
import type { YearProjection } from "../../../utils/compoundInterest";

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
const AXIS_LABEL_OFFSET = 20;
const HIT_SLOP_TOP = 20;
const TOOLTIP_WIDTH = 72;
const TOOLTIP_HEIGHT = 28;
const TOOLTIP_TAIL_SIZE = 6;

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
    <View
      style={[
        styles.tooltipContainer,
        {
          left: clampedLeft,
          top: Math.max(0, tooltip.y - TOOLTIP_HEIGHT - TOOLTIP_TAIL_SIZE - 2),
        },
      ]}
    >
      <View style={styles.tooltipBubble}>
        <Text variant="tiny" fontWeight="semiBold" color="neutral.c00">
          {formatTooltipValue(tooltip.value)}
        </Text>
      </View>
      <View style={[styles.tooltipTail, { marginLeft: tailLeft }]} />
    </View>
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
        .range([chartHeight, 0]),
    [maxTotal, chartHeight],
  );

  const bandwidth = xScale.bandwidth();

  const handleBarPress = useCallback(
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
    <View style={styles.container}>
      <Svg width={width} height={height} onPress={dismissTooltip}>
        {maxTotal > 0 && (
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
        )}

        {data.map(d => {
          const x = xScale(d.year) ?? 0;
          const total = d.deposits + d.rewards;

          const depositBarY = yScale(d.deposits);
          const depositBarHeight = chartHeight - depositBarY;

          const rewardsBarY = yScale(total);
          const rewardsBarHeight = depositBarY - rewardsBarY;

          return (
            <React.Fragment key={d.year}>
              {depositBarHeight > 0 && (
                <Rect
                  x={x}
                  y={depositBarY}
                  width={bandwidth}
                  height={depositBarHeight}
                  fill={depositColor}
                  onPress={() => handleBarPress(d.year, "deposits", d.deposits, x, depositBarY)}
                />
              )}
              {rewardsBarHeight > 0 && (
                <>
                  <Rect
                    x={x}
                    y={Math.max(0, rewardsBarY - HIT_SLOP_TOP)}
                    width={bandwidth}
                    height={Math.min(HIT_SLOP_TOP, rewardsBarY)}
                    fill="transparent"
                    onPress={() => handleBarPress(d.year, "rewards", d.rewards, x, rewardsBarY)}
                  />
                  <Path
                    d={roundedTopRect(x, rewardsBarY, bandwidth, rewardsBarHeight, BAR_RADIUS)}
                    fill={rewardsColor}
                    onPress={() => handleBarPress(d.year, "rewards", d.rewards, x, rewardsBarY)}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}

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

      {tooltip && <TooltipBubble tooltip={tooltip} width={width} />}
    </View>
  );
}

const TOOLTIP_BG = "rgba(255, 255, 255, 0.95)";

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  tooltipContainer: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
  },
  tooltipBubble: {
    width: TOOLTIP_WIDTH,
    height: TOOLTIP_HEIGHT,
    borderRadius: 6,
    backgroundColor: TOOLTIP_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipTail: {
    width: 0,
    height: 0,
    borderLeftWidth: TOOLTIP_TAIL_SIZE,
    borderRightWidth: TOOLTIP_TAIL_SIZE,
    borderTopWidth: TOOLTIP_TAIL_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TOOLTIP_BG,
  },
});

export default memo(SimulatorBarChart);
