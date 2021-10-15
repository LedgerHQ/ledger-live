import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BatteryHalfUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.94 16.944h16.176v-2.16h1.944V9.216h-1.944v-2.16H2.94v9.888zm.84-.816v-8.28h14.496v2.16h1.944v3.96h-1.944v2.16H3.78zm1.56-1.56h6.288v-5.16H5.34v5.16z"  /></Svg>;
}

export default BatteryHalfUltraLight;