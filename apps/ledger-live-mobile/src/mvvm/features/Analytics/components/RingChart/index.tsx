import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useRingChartViewModel } from "./useRingChartViewModel";
import type { ColorableDistributionItem } from "./types";

type Props = Readonly<{
  data: Array<ColorableDistributionItem>;
  size: number;
  strokeWidth?: number;
}>;

function RingChart({ data, size, strokeWidth = 3 }: Props) {
  const { paths, canvasColor, innerCircleRadius } = useRingChartViewModel(data, strokeWidth);

  return (
    <Svg testID="analytics-ring-chart" width={size} height={size} viewBox="0 0 76 76">
      <G transform="translate(38, 38)">
        {paths.items.map(({ pathData, color, id }) => (
          <Path key={id} stroke={canvasColor} strokeWidth={1.5} fill={color} d={pathData} />
        ))}
        <Circle cx={0} cy={0} r={innerCircleRadius} fill={canvasColor} />
      </G>
    </Svg>
  );
}

export default React.memo(RingChart);
