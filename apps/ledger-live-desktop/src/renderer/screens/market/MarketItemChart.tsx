import React, { memo } from "react";
import { useTheme } from "styled-components";
import { SparklineSvgData } from "@ledgerhq/live-common/market/types";

type Props = {
  sparklineIn7d: SparklineSvgData;
};

function SmallMarketItemChartComponent({ sparklineIn7d }: Props) {
  const { path, viewBox } = sparklineIn7d;

  const { colors } = useTheme();
  const color = colors.neutral.c80;

  return (
    <svg
      style={{ transform: "rotate 180deg" }}
      viewBox={viewBox}
      fill="none"
      width="100%"
      height="100%"
    >
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3px"
        d={path}
      />
    </svg>
  );
}

export const SmallMarketItemChart = memo<Props>(SmallMarketItemChartComponent);
