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
      d="M2 3.5H8C9.06087 3.5 10.0783 3.92143 10.8284 4.67157C11.5786 5.42172 12 6.43913 12 7.5V21.5C12 20.7044 11.6839 19.9413 11.1213 19.3787C10.5587 18.8161 9.79565 18.5 9 18.5H2V3.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 3.5H16C14.9391 3.5 13.9217 3.92143 13.1716 4.67157C12.4214 5.42172 12 6.43913 12 7.5V21.5C12 20.7044 12.3161 19.9413 12.8787 19.3787C13.4413 18.8161 14.2044 18.5 15 18.5H22V3.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
