import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.164 16.464h6v-.768h-5.088v-.432l2.856-2.04c1.608-1.152 2.16-2.016 2.16-3.12 0-1.8-1.392-2.76-3.024-2.76-1.92 0-3.096 1.344-3.096 2.88v.24h.816v-.24c0-1.2.72-2.112 2.256-2.112h.072c1.272 0 2.136.648 2.136 1.992 0 .888-.36 1.536-1.944 2.664L10.164 15v1.464zM4.068 12c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9z"  /></Svg>;
}

export default TwoCircledInitUltraLight;