// @flow

import Svg, { G, Polyline } from "react-native-svg";
import React from "react";

export default () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <G
      id="1"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
      opacity="0.88"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline
        id="Shape"
        stroke="#FFAE35"
        strokeWidth="4"
        points="5 9 12.9824256 9 12.9824256 15 20 15"
      />
    </G>
  </Svg>
);
