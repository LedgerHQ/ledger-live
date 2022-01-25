// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function AccountsIcon({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M14 3.5V3a2 2 0 0 0-2-2H3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h11a2 2 0 0 0 2-2V5.5a2 2 0 0 0-2-2zm.5 9.5a.5.5 0 0 1-.5.5H3c-.827 0-1.5-.673-1.5-1.5V4c0-.827.673-1.5 1.5-1.5h9a.5.5 0 0 1 .5.5v1h-9a.5.5 0 1 0 0 1H14a.5.5 0 0 1 .5.5V13zM12 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
      />
    </Svg>
  );
}
