// @flow
import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Exclamation({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="24.5" r="1.5" fill={color} />
      <Path
        d="M18 11V19"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
