import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NetworkWiredMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 21.36h7.44v-6H8.16v-2.52h7.68v2.52h-2.88v6h7.44v-6h-2.88v-2.52h4.32v-1.68h-9V8.64h2.88v-6H8.28v6h2.88v2.52h-9v1.68h4.32v2.52H3.6v6zm1.68-1.68v-2.64h4.08v2.64H5.28zM9.96 6.96V4.32h4.08v2.64H9.96zm4.68 12.72v-2.64h4.08v2.64h-4.08z"  /></Svg>;
}

export default NetworkWiredMedium;