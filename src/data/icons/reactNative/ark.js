//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Ark({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M7.997 4.151L1.395 15.08 0 14.236 7.997 1 16 14.236l-1.395.844L7.997 4.15zm-2.525 8.655v-1.63h5.039v1.63H5.47zm1.575-2.819v-1.63h1.941v1.63h-1.94z"
      />
    </Svg>
  );
}
