// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color?: string,
};

export default function Brackets({ size = 16, color = "currentColor" }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        d="M17.44 8.2h1.92V.64H11.8v1.92h5.64V8.2zM.64 19.336H8.2v-1.92H2.56v-5.64H.64v7.56zM.64 8.2h1.92V2.56H8.2V.64H.64V8.2zM11.8 19.36h7.56V11.8h-1.92v5.64H11.8v1.92z"
        fill={color}
      />
    </Svg>
  );
}
