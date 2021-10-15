import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BatteryHalfThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.36 16.56h15.336V14.4h1.944V9.6h-1.944V7.44H3.36v9.12zm.48-.48V7.92h14.376v2.16h1.944v3.84h-1.944v2.16H3.84zm1.44-1.44h6.24V9.36H5.28v5.28z"  /></Svg>;
}

export default BatteryHalfThin;