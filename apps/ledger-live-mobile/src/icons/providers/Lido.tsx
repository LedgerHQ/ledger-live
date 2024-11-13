import React from "react";
import type { ColorValue } from "react-native";
import { Path, Rect, Svg } from "react-native-svg";

const BASE_SIZE = 32;

type Props = {
  size?: number;
  outline?: ColorValue;
};

export function Lido({ size = BASE_SIZE, outline }: Props) {
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
      <Rect width={31} height={31} x={0.5} y={0.5} rx={7.5} stroke={outline} stroke-opacity={0.1} />
    </Svg>
  );
}
