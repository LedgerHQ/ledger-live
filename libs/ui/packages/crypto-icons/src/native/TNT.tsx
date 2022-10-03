import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#FF4081";

function TNT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M10.418 15.752l.118 2.623s1.406-.238 2.871 0l.117-2.623h-3.106zM8.72 13.725s4.101-.358 6.503 0l.234-2.861a44.339 44.339 0 00-6.855 0l.117 2.861zM19.5 6.333s-7.852-1.67-15 .12l.527 3.277.645-1.251s6.738-1.014 12.773 0l.586 1.252.469-3.398z"  /></Svg>;
}

TNT.DefaultColor = DefaultColor;
export default TNT;