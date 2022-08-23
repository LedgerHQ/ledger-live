// @flow
import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number,
};

export default function QRcode({ size = 16 }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <G fill="none" fillRule="nonzero">
        <Path stroke="#bdb3ff" d="M1 1h6v6H1zM1 9h6v6H1zM9 1h6v6H9z" />
        <Path fill="#bdb3ff" d="M3 3h2v2H3zM11 3h2v2h-2z" />
        <G fill="#bdb3ff">
          <Path d="M8.5 8.5h3v1h-3zM12.5 10.5h1v2h-1zM12.5 8.5h3v1h-3zM10.5 12.5h3v1h-3zM8.5 12.5h1v3h-1z" />
          <Path d="M8.5 8.5h1v3h-1zM10.5 10.5h1v1h-1zM10.5 14.5h1v1h-1zM12.5 14.5h3v1h-3zM14.5 8.5h1v5h-1z" />
        </G>
        <Path fill="#bdb3ff" d="M3 11h2v2H3z" />
      </G>
    </Svg>
  );
}
