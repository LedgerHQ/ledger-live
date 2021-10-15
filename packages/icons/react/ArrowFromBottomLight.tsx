import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowFromBottomLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.424 5.064V16.92h1.152V5.04a154.06 154.06 0 001.944 1.992l2.232 2.208.744-.744L12 3 6.504 8.496l.768.744 2.232-2.208 1.92-1.968zM3.6 21h16.8v-1.2H3.6V21z"  /></Svg>;
}

export default ArrowFromBottomLight;