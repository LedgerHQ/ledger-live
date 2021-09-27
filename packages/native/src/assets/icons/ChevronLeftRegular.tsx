import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronLeftRegular({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.028 19.848L9.18 12l7.848-7.848-1.104-1.104L6.972 12l8.952 8.952 1.104-1.104z"
        fill={color}
      />
    </Svg>
  );
}

export default ChevronLeftRegular;
