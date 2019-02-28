// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Assets({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M3.333 2.75c-.69 0-1.25.56-1.25 1.25v5.333c0 .69.56 1.25 1.25 1.25h9.334c.69 0 1.25-.56 1.25-1.25V4c0-.69-.56-1.25-1.25-1.25H3.333zm5.417 9.333v1.167h1.917a.75.75 0 0 1 0 1.5H5.333a.75.75 0 1 1 0-1.5H7.25v-1.167H3.333a2.75 2.75 0 0 1-2.75-2.75V4a2.75 2.75 0 0 1 2.75-2.75h9.334A2.75 2.75 0 0 1 15.417 4v5.333a2.75 2.75 0 0 1-2.75 2.75H8.75z"
      />
    </Svg>
  );
}
