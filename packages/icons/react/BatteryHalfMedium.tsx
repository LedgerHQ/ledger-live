import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BatteryHalfMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 18.12h18.696v-2.16h1.944V8.04h-1.944V5.88H1.68v12.24zm1.92-1.8V7.68h14.856v2.16H20.4v4.32h-1.944v2.16H3.6zm1.92-1.92H12V9.6H5.52v4.8z"  /></Svg>;
}

export default BatteryHalfMedium;