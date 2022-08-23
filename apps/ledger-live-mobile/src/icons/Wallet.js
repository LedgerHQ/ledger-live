// @flow
import React from "react";
import Svg, { Path, G, Circle } from "react-native-svg";

type Props = {
  size: number,
};

export default function Wallet({ size = 16 }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <G fill="none" transform="translate(.5 .5)">
        <Path
          stroke="#bdb3ff"
          strokeWidth="1.1"
          d="M13.5 12.38v1.551a.556.556 0 0 1-.542.569H1.67A1.17 1.17 0 0 1 .5 13.33V1.5m2.053 1.005h10.405c.3 0 .542.255.542.569V4.61"
        />
        <Path
          stroke="#bdb3ff"
          strokeWidth="1.1"
          d="M9.5 6.5h4.025c.538 0 .975.437.975.975v2.05a.975.975 0 0 1-.975.975H9.5a2 2 0 1 1 0-4z"
        />
        <Circle cx="10" cy="8.5" r="1" fill="#bdb3ff" />
        <Path
          stroke="#bdb3ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1"
          d="M12.5.5h-11a1 1 0 1 0 0 2h1.118"
        />
      </G>
    </Svg>
  );
}
