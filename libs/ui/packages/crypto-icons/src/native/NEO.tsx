import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#7DD224";

function NEO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.375 16.935l-5.242-2.443V9.075l5.242-1.859v9.718zM10.742 19.5l-5.117-2.384V7.468l5.117 2.386V19.5zM18.25 6.868l-.085.03-5.032 1.786-.126.045-2.133.756-5.047-2.352 7.18-2.548.063-.022.132-.047.047-.016 5.047 2.352-.047.016z"  /></Svg>;
}

NEO.DefaultColor = DefaultColor;
export default NEO;