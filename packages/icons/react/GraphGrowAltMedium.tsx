import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowAltMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.16 20.232h18.72V18.36H4.08V4.392H2.16v15.84zm3.624-4.896l4.656-4.632 2.88 2.88 6.912-6.912c-.048.6-.072 1.176-.072 1.752v1.512h1.68l-.024-6.168h-6.144v1.68h1.512c.552 0 1.152 0 1.728-.048l-5.592 5.592-2.88-2.88-4.656 4.632v2.592z"  /></Svg>;
}

export default GraphGrowAltMedium;