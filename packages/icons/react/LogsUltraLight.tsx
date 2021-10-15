import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LogsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.82 12.828h18.36v-.84H2.82v.84zm0 5.52h13.56v-.84H2.82v.84zm0-10.2L4.86 6.9 2.82 5.652v2.496zm4.392-.84H21.18v-.84H7.212v.84z"  /></Svg>;
}

export default LogsUltraLight;