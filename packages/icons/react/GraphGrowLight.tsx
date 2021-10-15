import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.988 14.4l4.728-4.704h7.512l4.728-4.728c-.024.864-.024 1.704-.024 2.544v1.776h1.08l-.024-6.168h-6.144V4.2h1.776c.84 0 1.68 0 2.52-.024l-4.416 4.392H7.236l-4.248 4.224V14.4zm0 6.48h1.248v-2.928H2.988v2.928zm4.176 0h1.272v-4.824H7.164v4.824zm4.2 0h1.248v-7.92h-1.248v7.92zm4.176 0h1.272v-5.76H15.54v5.76zm4.176 0h1.272V12h-1.272v8.88z"  /></Svg>;
}

export default GraphGrowLight;