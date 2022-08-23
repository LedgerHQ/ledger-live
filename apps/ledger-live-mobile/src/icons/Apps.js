// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

const Apps = ({ size = 20, color = "#142533" }: Props) => (
  <Svg viewBox="0 0 24 24" height={size} width={size} fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 8.5v-6h6v6h-6ZM1 2a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2Zm1.5 17.5v-6h6v6h-6ZM1 13a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-7ZM13.5 2.5v6h6v-6h-6ZM13 1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-7Zm.5 18.5v-6h6v6h-6ZM12 13a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7Z"
      fill={color}
    />
  </Svg>
);

export default Apps;
