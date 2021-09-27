import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronLeftUltraLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.644 20.112L8.556 12l8.088-8.112-.576-.576L7.356 12l8.712 8.688.576-.576z"
        fill={color}
      />
    </Svg>
  );
}

export default ChevronLeftUltraLight;
