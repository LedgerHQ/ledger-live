import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DashboardMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 20.4h18.72v-1.872H4.56V4.56H2.64V20.4zm4.152-3.96h2.04V10.8h-2.04v5.64zm4.176 0h2.04V5.976h-2.04V16.44zm4.176 0h2.04V8.376h-2.04v8.064zm4.176 0h2.04V3.6h-2.04v12.84z"  /></Svg>;
}

export default DashboardMedium;