// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function DropdownArrow({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 10 6" width={size} height={size}>
      <Path
        fill={color}
        d="M5.00006 5.99994L9.28406 1.69794L8.27606 0.689941L5.00006 3.94794L1.72406 0.689941L0.716064 1.69794L5.00006 5.99994Z"
      />
    </Svg>
  );
}
