import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.192 13.992l4.464-4.44h7.32l5.088-5.088v4.824h.768V3.12h-6.144v.768h4.8L14.64 8.736H7.32l-4.128 4.128v1.128zm-.024 6.888h.888v-2.928h-.888v2.928zm4.2 0h.864v-4.824h-.864v4.824zm4.2 0h.864v-7.92h-.864v7.92zm4.2 0h.864v-5.76h-.864v5.76zm4.176 0h.864V12h-.864v8.88z"  /></Svg>;
}

export default GraphGrowUltraLight;