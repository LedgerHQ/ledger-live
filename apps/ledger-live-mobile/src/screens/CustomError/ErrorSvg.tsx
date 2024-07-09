import React from "react";
import Svg, { Rect, Path } from "react-native-svg";

const ErrorSvg = () => (
  <Svg width={70} height={70} viewBox="0 0 64 64" fill="none">
    <Rect width="64" height="64" rx="32" fill="white" fillOpacity="0.05" />
    <Path
      d="M43.104 41.12L33.984 32L43.104 22.88L41.056 20.96L32 30.016L22.944 20.96L20.896 22.88L30.016 32L20.896 41.12L22.944 43.04L32 33.984L41.056 43.04L43.104 41.12Z"
      fill="#E86164"
    />
  </Svg>
);

export default ErrorSvg;
