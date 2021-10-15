import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CopyUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.16 15.24H21V3l-12.24.024V6.84h.84v-3l10.56-.024v10.608h-3v.816zM3 21h12.24V8.76H3V21zm.84-.816V9.576H14.4v10.608H3.84z"  /></Svg>;
}

export default CopyUltraLight;