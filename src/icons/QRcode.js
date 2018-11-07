// @flow
import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number,
};

export default function QRcode({ size }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <G fill="none">
        <Path stroke="#6490F1" d="M1 1h6v6H1zm0 8h6v6H1zm8-8h6v6H9z" />
        <Path fill="#6490F1" d="M3 3h2v2H3zm8 0h2v2h-2z" />
        <G fill="#6490F1">
          <Path d="M8.5 8.5h3v1h-3zm4 2h1v2h-1zm0-2h3v1h-3zm-2 4h3v1h-3zm-2 0h1v3h-1z" />
          <Path d="M8.5 8.5h1v3h-1zm2 2h1v1h-1zm0 4h1v1h-1zm2 0h3v1h-3zm2-6h1v5h-1z" />
        </G>
      </G>
    </Svg>
  );
}
