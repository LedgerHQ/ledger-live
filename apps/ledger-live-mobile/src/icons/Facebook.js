// @flow

import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default ({ size = 16, color }: Props) => (
  <Svg height={size} width={size} viewBox="0 0 13 23">
    <Path
      d="M11.9883 12.625L12.5898 8.67188H8.76562V6.09375C8.76562 4.97656 9.28125 3.94531 11 3.94531H12.7617V0.550781C12.7617 0.550781 11.1719 0.25 9.66797 0.25C6.53125 0.25 4.46875 2.18359 4.46875 5.62109V8.67188H0.945312V12.625H4.46875V22.25H8.76562V12.625H11.9883Z"
      fill={color}
    />
  </Svg>
);
