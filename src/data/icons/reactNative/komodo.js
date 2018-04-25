//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Komodo({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M8 0l5.66 2.347L16 8l-2.34 5.66L8 16l-5.653-2.34L0 8l2.347-5.653L8 0zm0 1.773L3.6 3.6 1.773 8 3.6 12.406 8 14.228l4.406-1.822L14.228 8l-1.822-4.4L8 1.773zm0 2.14l2.89 1.195L12.095 8l-1.203 2.891-2.89 1.203-2.893-1.203L3.913 8l1.196-2.892L8 3.913zm-1.638 2.45L5.685 8l.678 1.639L8 10.32l1.638-.682L10.32 8l-.68-1.637L8 5.685l-1.638.677z"
      />
    </Svg>
  );
}
