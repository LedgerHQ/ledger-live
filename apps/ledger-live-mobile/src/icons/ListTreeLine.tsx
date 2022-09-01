import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  height?: number;
  color: string;
};
export default function ListTreeLine({ height = 50, color }: Props) {
  return (
    <Svg width="14" height={height} viewBox="0 0 14 59" fill="none">
      <Path
        d="M0.999997 5.36234e-07L0.999999 55C0.999999 56.6569 2.34315 58 4 58L14 58"
        stroke={color}
      />
    </Svg>
  );
}
