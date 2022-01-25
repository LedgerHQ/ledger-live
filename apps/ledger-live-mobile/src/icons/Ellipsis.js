// @flow
import React from "react";
import Svg, { Circle, G } from "react-native-svg";

type Props = {
  size?: number,
  color?: string,
};

export default function Ellipsis({ size = 16, color = "#142533" }: Props) {
  return (
    <Svg viewBox="0 0 31 31" width={size} height={size}>
      <G
        fill={color}
        fillOpacity="1"
        fillRule="evenodd"
        stroke={color}
        strokeWidth="1"
        transform="translate(0 12)"
      >
        <Circle cx="4.5" cy="4.5" r="3" />
        <Circle cx="15.5" cy="4.5" r="3" />
        <Circle cx="26.5" cy="4.5" r="3" />
      </G>
    </Svg>
  );
}
