import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function UP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M16.512 5.77h-8.75l-4.558 4.558 8.932 8.933 8.933-8.933zm-4.375 2.856l-3.15 3.15 1.243 1.243 1.907-1.907 1.907 1.907 1.242-1.243z" clipRule="evenodd" /></Svg>;
}
UP.DefaultColor = DefaultColor;
export default UP;