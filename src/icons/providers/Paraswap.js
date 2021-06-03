// @flow

import React from "react";
import Svg, { G, Defs, Path, Rect, ClipPath } from "react-native-svg";

const Paraswap = ({ size }: { size: number }) => (
  <Svg viewBox="0 0 32 32" height={size} width={size}>
    <G clipPath="url(#clip0)">
      <Path
        d="M7.10074 15.2097L0.166992 3.20013L14.0345 3.20014L7.10074 15.2097Z"
        fill="#266EF0"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.4874 3.2362L32.167 28.6619L2.80786 28.662L17.4874 3.2362ZM17.4874 10.4492L25.9204 25.0555L9.05448 25.0555L17.4874 10.4492Z"
        fill="#266EF0"
      />
    </G>
    <Defs>
      <ClipPath id="clip0">
        <Rect
          width="32"
          height="32"
          fill="white"
          transform="translate(0.166992)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export default Paraswap;
