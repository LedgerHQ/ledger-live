import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3C87C7";

function ARDR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M11.912 14.018l1.327 1.733-3.864 2.624 2.537-4.357zM12 5.624l2.045 3.355-5.454 9.395H4.5L12 5.625zm0 7.382l2.727-2.014 4.773 7.382h-3.409L12 13.007z"  /></Svg>;
}

ARDR.DefaultColor = DefaultColor;
export default ARDR;