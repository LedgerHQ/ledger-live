// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function ArrowDown({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 9.9998 6.4997" width={size} height={size}>
      <Path
        fill={color}
        d="m1.5019 0h6.996c1.333 0 2.005 1.617 1.06 2.56l-3.497 3.5a1.5 1.5 0 0 1-2.122 0l-3.498-3.5c-0.942-0.941-0.275-2.56 1.059-2.56z"
      />
    </Svg>
  );
}
