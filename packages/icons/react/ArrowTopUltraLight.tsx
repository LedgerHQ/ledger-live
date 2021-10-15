import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowTopUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.592 4.116v17.256h.816V4.116l2.448 2.472 3.216 3.216.552-.552L12 2.628 5.376 9.252l.552.552 3.216-3.216 2.448-2.472z"  /></Svg>;
}

export default ArrowTopUltraLight;