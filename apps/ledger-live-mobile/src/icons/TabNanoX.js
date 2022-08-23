// @flow

import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size?: number,
  width?: number,
  height?: number,
  color: string,
  style?: *,
};

export default function TabNanoX({
  size = 16,
  width,
  height,
  color,
  style,
}: Props) {
  return (
    <Svg
      width={width || size}
      height={height || size}
      viewBox="0 0 16 16"
      style={style}
    >
      <G
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <G
          id="nano-x"
          transform="translate(5.000000, 0.000000)"
          fill={color}
          fillRule="nonzero"
        >
          <G id="a-link">
            <Path
              d="M5.75,6.835 C5.35870184,6.3382356 4.84043366,5.95644471 4.25,5.73 L4.25,1.75 L1.75,1.75 L1.75,5.73 C1.15956634,5.95644471 0.641298156,6.3382356 0.25,6.835 L0.25,1.666 C0.25,0.884 0.884,0.25 1.666,0.25 L4.334,0.25 C5.116,0.25 5.75,0.884 5.75,1.666 L5.75,6.835 Z M4.25,14.25 L4.25,9.5 C4.25,8.80964406 3.69035594,8.25 3,8.25 C2.30964406,8.25 1.75,8.80964406 1.75,9.5 L1.75,14.25 L4.25,14.25 Z M3,6.75 C4.51878306,6.75 5.75,7.98121694 5.75,9.5 L5.75,14.334 C5.75,15.116 5.116,15.75 4.334,15.75 L1.666,15.75 C0.883964794,15.75 0.25,15.1160352 0.25,14.334 L0.25,9.5 C0.25,7.98121694 1.48121694,6.75 3,6.75 Z"
              id="a"
            />
          </G>
        </G>
      </G>
    </Svg>
  );
}
