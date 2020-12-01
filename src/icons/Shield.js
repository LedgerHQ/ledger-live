// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default ({ size = 16, color }: Props) => (
  <Svg height={size} width={size} viewBox="0 0 24 25">
    <Path
      d="M11.9999 23.4091C23.9716 18.3741 21.7923 4.86364 21.7923 4.86364L11.9999 1.59091L2.20748 4.86364C2.20748 4.86364 0.0282526 18.3741 11.9999 23.4091Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <Path
      d="M7.53711 11.4091L10.5123 14.3843L16.4627 8.4339"
      stroke={color}
      strokeWidth="1.5"
    />
  </Svg>
);
