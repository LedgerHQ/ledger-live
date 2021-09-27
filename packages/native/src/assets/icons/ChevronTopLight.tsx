import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronTopLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.032 16.836L12 8.844l7.968 7.992.864-.864L12 7.164l-8.832 8.808.864.864z"
        fill={color}
      />
    </Svg>
  );
}

export default ChevronTopLight;
