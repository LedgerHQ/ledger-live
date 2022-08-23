// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Check({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M13.765 2.11l-8.22 8.22-3.021-3.02a.375.375 0 0 0-.53 0l-.884.883a.375.375 0 0 0 0 .53l4.17 4.17a.375.375 0 0 0 .53 0l9.369-9.369a.375.375 0 0 0 0-.53l-.884-.884a.375.375 0 0 0-.53 0z"
      />
    </Svg>
  );
}
