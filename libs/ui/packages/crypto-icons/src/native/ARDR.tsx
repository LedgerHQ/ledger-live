import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3c87c7";
function ARDR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M11.912 14.018l1.327 1.733-3.864 2.624zM12 5.624l2.045 3.355-5.454 9.395H4.5zm0 7.382l2.727-2.014 4.773 7.382h-3.409z" clipRule="evenodd" /></Svg>;
}
ARDR.DefaultColor = DefaultColor;
export default ARDR;