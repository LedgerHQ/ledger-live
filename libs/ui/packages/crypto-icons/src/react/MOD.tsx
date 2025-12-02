import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#09547d";
function MOD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M17.244 15.76V6.067l-4.734 4.836z" opacity={0.5} /><path  d="M6.756 5.256l.228.234 6.35 6.506-6.578 6.748z" /></Svg>;
}
MOD.DefaultColor = DefaultColor;
export default MOD;