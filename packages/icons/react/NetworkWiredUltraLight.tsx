import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NetworkWiredUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 21.36h7.44v-6H7.704v-2.976h8.592v2.976H12.96v6h7.44v-6h-3.336v-2.976h4.776v-.768h-9.456V8.64h3.336v-6H8.28v6h3.336v2.976H2.16v.768h4.776v2.976H3.6v6zm.792-.768v-4.464h5.88v4.464h-5.88zm4.68-12.744v-4.44h5.88v4.44h-5.88zm4.68 12.744v-4.464h5.88v4.464h-5.88z"  /></Svg>;
}

export default NetworkWiredUltraLight;