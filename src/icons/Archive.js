// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Archive({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M13.25 5.333a.75.75 0 1 1 1.5 0V14a.75.75 0 0 1-.75.75H2a.75.75 0 0 1-.75-.75V5.333a.75.75 0 0 1 1.5 0v7.917h10.5V5.333zM.667 1.25h14.666a.75.75 0 0 1 .75.75v3.333a.75.75 0 0 1-.75.75H.667a.75.75 0 0 1-.75-.75V2a.75.75 0 0 1 .75-.75zm.75 1.5v1.833h13.166V2.75H1.417zm5.25 6a.75.75 0 1 1 0-1.5h2.666a.75.75 0 0 1 0 1.5H6.667z"
      />
    </Svg>
  );
}
