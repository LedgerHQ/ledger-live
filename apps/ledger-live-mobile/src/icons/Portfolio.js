// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function PortflioIcon({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M.25 2a.75.75 0 0 1 1.5 0v11c0 .69.56 1.25 1.25 1.25h11a.75.75 0 1 1 0 1.5H3A2.75 2.75 0 0 1 .25 13V2zm6.37 6.843l-1.965 3.522a.75.75 0 0 1-1.31-.73l2.227-3.992a.75.75 0 0 1 .79-.372l4.973.911 1.979-4.485a.75.75 0 0 1 1.372.606L12.468 9.33a.75.75 0 0 1-.821.434l-5.027-.92z"
      />
    </Svg>
  );
}
