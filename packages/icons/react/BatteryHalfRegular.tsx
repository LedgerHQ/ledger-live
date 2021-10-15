import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BatteryHalfRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.1 17.736h17.856v-2.16H21.9V8.424h-1.944v-2.16H2.1v11.472zm1.56-1.488v-8.52h14.736v2.16h1.944v4.2h-1.944v2.16H3.66zm1.8-1.8h6.408v-4.92H5.46v4.92z"  /></Svg>;
}

export default BatteryHalfRegular;