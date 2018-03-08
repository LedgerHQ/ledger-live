// @flow
import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function IconDogecoin({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 2000 2000" width={size} height={size}>
      <G fill={color}>
        <Path
          fill={color}
          d="M1024 659H881.12v281.69h224.79v117.94H881.12v281.67H1031c38.51 0 316.16 4.35 315.73-327.72S1077.44 659 1024 659z"
        />
        <Path
          fill={color}
          d="M1000 0C447.71 0 0 447.71 0 1000s447.71 1000 1000 1000 1000-447.71 1000-1000S1552.29 0 1000 0zm39.29 1540.1H677.14v-481.46H549.48V940.7h127.65V459.21h310.82c73.53 0 560.56-15.27 560.56 549.48 0 574.09-509.21 531.41-509.21 531.41z"
        />
      </G>
    </Svg>
  );
}
