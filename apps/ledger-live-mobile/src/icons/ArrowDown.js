// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function ArrowDown({ size = 10, color }: Props) {
  return (
    <Svg viewBox="0 0 10 10" width={size} height={size} fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 10,2.72728 V 8.5 10 H 8.5 2.72727 V 8.5 H 7.43934 L 0.15149,1.21215 1.21215,0.151489 8.5,7.43934 V 2.72728 Z"
        fill={color}
      />
    </Svg>
  );
}
