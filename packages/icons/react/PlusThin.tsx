import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PlusThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.4 11.76h-8.16V3.6h-.48v8.16H3.6v.48h8.16v8.16h.48v-8.16h8.16v-.48z"  /></Svg>;
}

export default PlusThin;