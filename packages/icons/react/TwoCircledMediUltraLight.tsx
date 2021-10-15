import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.096 16.464h6v-.768h-5.088v-.432l2.88-2.04c1.584-1.128 2.136-1.992 2.136-3.12 0-1.8-1.392-2.76-3.024-2.76-1.92 0-3.096 1.344-3.096 2.88v.24h.816v-.24c0-1.2.72-2.112 2.256-2.112h.072c1.272 0 2.136.648 2.136 1.992 0 .888-.36 1.512-1.944 2.664L9.096 15v1.464zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84z"  /></Svg>;
}

export default TwoCircledMediUltraLight;