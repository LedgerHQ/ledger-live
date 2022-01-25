// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function ArrowUp({ size = 10, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.72728 0H8.5H10V1.5V7.27273H8.5V2.56066L1.21215 9.84851L0.151489 8.78785L7.43934 1.5H2.72728V0Z"
        fill={color}
      />
    </Svg>
  );
}
