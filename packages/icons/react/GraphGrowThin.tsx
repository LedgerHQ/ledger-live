import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.36 13.584l4.224-4.2h7.128l5.448-5.448v5.352h.48V3.12h-6.144v.48H19.824L14.52 8.904H7.392L3.36 12.912v.672zm0 7.296h.48v-2.928h-.48v2.928zm4.2 0h.48v-4.824h-.48v4.824zm4.2 0h.48v-7.92h-.48v7.92zm4.2 0h.48v-5.76h-.48v5.76zm4.2 0h.48V12h-.48v8.88z"  /></Svg>;
}

export default GraphGrowThin;