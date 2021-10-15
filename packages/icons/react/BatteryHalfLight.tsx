import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BatteryHalfLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.52 17.34h17.016v-2.16h1.944V8.82h-1.944V6.66H2.52v10.68zm1.2-1.128v-8.4h14.616v2.16h1.944v4.08h-1.944v2.16H3.72zm1.68-1.68h6.36v-5.04H5.4v5.04z"  /></Svg>;
}

export default BatteryHalfLight;