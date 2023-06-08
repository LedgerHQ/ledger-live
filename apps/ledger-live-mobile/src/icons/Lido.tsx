import React from "react";
import { Path, Rect, Svg } from "react-native-svg";

type Props = {
  size: number;
};

export function Lido({ size }: Props) {
  return (
    <Svg width={size} height={size} fill="none" viewBox="0 0 32 33">
      <Rect width="32" height="32" fill="#47A1F8" rx="8" />
      <Path
        fill="#fff"
        fill-rule="evenodd"
        d="m16 6.4 4.5 7.4-4.5 2.8-4.5-2.8L16 6.4Zm-3.1 7 3.1-5 3.1 5-3 2-3.2-2Z"
        clip-rule="evenodd"
      />
      <Path
        fill="#fff"
        d="M16 18.2 10.8 15l-.2.3a7 7 0 0 0 .9 8.3 6.2 6.2 0 0 0 9 0 7 7 0 0 0 .9-8.3l-.1-.3-5.3 3.2Z"
      />
      <Rect
        width="31"
        height="31"
        x=".5"
        y=".5"
        stroke="#fff"
        stroke-opacity=".1"
        rx="7.5"
      />
    </Svg>
  );
}
