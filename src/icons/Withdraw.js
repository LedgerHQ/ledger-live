// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function TransferIcon({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 7 2" width={size} height={size}>
      <Path
        fill={color}
        d="M6.89844 0.109375H0.101562V1.75H6.89844V0.109375Z"
      />
    </Svg>
  );
}
