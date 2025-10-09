import React, { memo } from "react";
import { useTheme } from "styled-components";

type Props = {
  data: number[];
  width?: number;
  height?: number;
};

function SimpleSparklineComponent({ data, width = 100, height = 50 }: Props) {
  const { colors } = useTheme();
  const color = colors.neutral.c80;

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate the SVG path from the data points
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // If all values are the same, create a horizontal line
  if (range === 0) {
    const y = height / 2;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={y} x2={width} y2={y} stroke={color} strokeWidth="2" />
      </svg>
    );
  }

  // Create the path
  const stepX = width / (data.length - 1);
  const pathData = data
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={pathData}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export const SimpleSparkline = memo<Props>(SimpleSparklineComponent);
