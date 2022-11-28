import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function TransferIcon({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.3507 13.75H3.64941V12.25H22.3507V13.75Z"
        fill={color}
      />
    </Svg>
  );
}
