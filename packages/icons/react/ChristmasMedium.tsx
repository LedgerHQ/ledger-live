import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChristmasMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.92 21.84h2.16v-3.12h8.4l-4.104-5.736h2.232L12 2.16 4.392 12.984h2.232L2.52 18.72h8.4v3.12zm-4.848-4.92l4.104-5.736h-2.28L12 5.352l4.104 5.832h-2.28l4.104 5.736H6.072z"  /></Svg>;
}

export default ChristmasMedium;