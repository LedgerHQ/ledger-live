// @flow

import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import colors from "../colors";

type Props = {
  size: number,
  color: string,
  strokeColor: String,
};

export default function Genuine({
  size = 15,
  strokeColor = colors.white,
  color = colors.live,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Circle cx="7.5" cy="7.5" r="7.5" fill={color} />
      <Path
        d="M4.66162 7.5L6.58111 9.40909L10.4201 5.59091"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
