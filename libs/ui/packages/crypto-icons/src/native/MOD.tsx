import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#09547D";

function MOD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path opacity={0.5} d="M17.244 15.76V6.067l-4.734 4.836 4.734 4.859z"  /><Path d="M6.756 5.256l.228.234 6.35 6.506-6.578 6.748V5.256z"  /></Svg>;
}

MOD.DefaultColor = DefaultColor;
export default MOD;