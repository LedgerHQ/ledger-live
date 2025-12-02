import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#ac72f9";
function TLOS({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M12 .219C5.5.219.219 5.5.219 12S5.5 23.781 12 23.781 23.781 18.5 23.781 12 18.5.219 12 .219M12 3.5c4.697 0 8.5 3.803 8.5 8.5s-3.803 8.5-8.5 8.5A8.497 8.497 0 013.5 12c0-4.697 3.803-8.5 8.5-8.5" /></Svg>;
}
TLOS.DefaultColor = DefaultColor;
export default TLOS;