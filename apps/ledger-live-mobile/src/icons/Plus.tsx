import React from "react";
import Svg, { Path } from "react-native-svg";

export default ({ size, color }: { size: number; color?: string }) => (
  <Svg viewBox="0 0 16 16" width={size} height={size}>
    <Path
      fill={color}
      d="M14.625 7.125h-5.75v-5.75A.376.376 0 0 0 8.5 1h-1a.376.376 0 0 0-.375.375v5.75h-5.75A.376.376 0 0 0 1 7.5v1c0 .206.169.375.375.375h5.75v5.75c0 .206.169.375.375.375h1a.376.376 0 0 0 .375-.375v-5.75h5.75A.376.376 0 0 0 15 8.5v-1a.376.376 0 0 0-.375-.375z"
    />
  </Svg>
);
