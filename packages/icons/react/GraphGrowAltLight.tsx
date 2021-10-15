import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowAltLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.4 20.232h18.72v-1.176H3.6V4.392H2.4v15.84zm2.784-5.016l5.016-4.992 2.88 2.88 7.488-7.488c-.024.864-.048 1.704-.048 2.544v1.776h1.08V3.768h-6.144v1.08h1.776c.816 0 1.656 0 2.496-.024l-6.648 6.648-2.88-2.88-5.016 5.016v1.608z"  /></Svg>;
}

export default GraphGrowAltLight;