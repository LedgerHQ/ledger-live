import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeLight({ size = 16, color = "currentColor" }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.332c3.816 0 7.896-3.144 9.84-7.32-1.944-4.2-6.024-7.344-9.84-7.344-3.792 0-7.896 3.144-9.84 7.344 1.944 4.176 6.048 7.32 9.84 7.32zm-8.52-7.32C5.376 8.316 8.76 5.82 12 5.82c3.24 0 6.624 2.496 8.52 6.192-1.896 3.696-5.28 6.192-8.52 6.192-3.24 0-6.624-2.496-8.52-6.192zm5.16 0a3.37 3.37 0 003.36 3.36 3.37 3.37 0 003.36-3.36A3.37 3.37 0 0012 8.652a3.37 3.37 0 00-3.36 3.36zm1.08 0A2.279 2.279 0 0112 9.732a2.264 2.264 0 012.28 2.28 2.279 2.279 0 01-2.28 2.28 2.295 2.295 0 01-2.28-2.28z"
        fill={color}
      />
    </Svg>
  );
}

export default EyeLight;
