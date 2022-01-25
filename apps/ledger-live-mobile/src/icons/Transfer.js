// @flow
import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function TransferIcon({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <G transform="rotate(90 7.5 8.5)">
        <Path
          fill={color}
          d="M11.248 3.025l-1.124-1.124a.75.75 0 0 1 1.06-1.06l2.405 2.404a.75.75 0 0 1 0 1.06L11.184 6.71a.75.75 0 0 1-1.06-1.06l1.124-1.124H1.025a.75.75 0 0 1 0-1.5h10.223zm-8.546 10l1.124 1.124a.75.75 0 0 1-1.06 1.06L.36 12.805a.75.75 0 0 1 0-1.06L2.766 9.34a.75.75 0 0 1 1.06 1.06l-1.124 1.124h9.473a.75.75 0 1 1 0 1.5H2.702z"
        />
      </G>
    </Svg>
  );
}
