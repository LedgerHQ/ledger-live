import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.628 15.24l5.208-5.208h7.896l4.032-4.008c-.048.6-.048 1.176-.048 1.752v1.512h1.656l-.024-6.168h-6.144V4.8h1.512c.552 0 1.152 0 1.728-.048l-3.48 3.48H7.116l-4.488 4.464v2.544zm0 5.64h2.04v-2.928h-2.04v2.928zm4.176 0h2.04v-4.824h-2.04v4.824zm4.176 0h2.04v-7.92h-2.04v7.92zm4.176 0h2.04v-5.76h-2.04v5.76zm4.152 0h2.04V12h-2.04v8.88z"  /></Svg>;
}

export default GraphGrowMedium;