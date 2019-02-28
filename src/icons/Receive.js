// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Receive({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M7.25 1.194C7.25.811 7.586.5 8 .5s.75.31.75.694v11.112c0 .383-.336.694-.75.694s-.75-.31-.75-.694V1.194zm4.22 6.526a.75.75 0 0 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06L8 11.19l3.47-3.47zm-8.553 7.53c-.369 0-.667-.336-.667-.75s.298-.75.667-.75h10.666c.369 0 .667.336.667.75s-.298.75-.667.75H2.917z"
      />
    </Svg>
  );
}
