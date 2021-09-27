import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowRightThin({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.748 18.624L21.372 12l-6.624-6.624-.336.336L17.58 8.88l2.88 2.88H2.628v.48H20.46l-2.88 2.88-3.168 3.168.336.336z"
        fill={color}
      />
    </Svg>
  );
}

export default ArrowRightThin;
