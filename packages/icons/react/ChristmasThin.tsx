import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChristmasThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.76 20.88h.48V18h8.4l-3.96-5.52h1.872L12 3.12l-6.552 9.36h1.896L3.36 18h8.4v2.88zm-7.464-3.36L8.28 12H6.36L12 3.96 17.64 12h-1.896l3.96 5.52H4.296z"  /></Svg>;
}

export default ChristmasThin;