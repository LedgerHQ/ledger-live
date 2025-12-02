import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1f4c9f";
function APEX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M4.5 15.188L12 5.624l7.5 9.563v3.187L12 8.813l-7.5 9.562zm7.875.937a1.875 1.875 0 110-3.75 1.875 1.875 0 010 3.75" clipRule="evenodd" /></Svg>;
}
APEX.DefaultColor = DefaultColor;
export default APEX;