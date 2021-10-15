import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PlusUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.4 11.568h-7.968V3.6h-.864v7.968H3.6v.864h7.968V20.4h.864v-7.968H20.4v-.864z"  /></Svg>;
}

export default PlusUltraLight;