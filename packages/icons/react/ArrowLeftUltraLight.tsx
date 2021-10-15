import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowLeftUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.252 18.624l.552-.552-3.216-3.216a238.903 238.903 0 00-2.472-2.448h17.256v-.816H4.116c.84-.816 1.656-1.632 2.472-2.448l3.216-3.216-.552-.552L2.628 12l6.624 6.624z"  /></Svg>;
}

export default ArrowLeftUltraLight;