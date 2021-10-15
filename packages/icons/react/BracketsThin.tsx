import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketsThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.92 10.2h.48V3.6h-6.6v.48h6.12v6.12zM3.6 20.4h6.6v-.48H4.08v-6.144H3.6V20.4zm0-10.2h.48V4.08h6.12V3.6H3.6v6.6zm10.2 10.2h6.6v-6.6h-.48v6.12H13.8v.48z"  /></Svg>;
}

export default BracketsThin;