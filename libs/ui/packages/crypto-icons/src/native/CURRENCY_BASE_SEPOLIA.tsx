import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function CURRENCY_BASE_SEPOLIA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" strokeMiterlimit={10} fill={color}><Path d="M21.467 12c0 5.227-4.246 9.464-9.483 9.464-4.97 0-9.046-3.814-9.451-8.668h12.535v-1.591H2.533c.405-4.855 4.481-8.67 9.45-8.67 5.238 0 9.484 4.238 9.484 9.465" /></Svg>;
}
CURRENCY_BASE_SEPOLIA.DefaultColor = DefaultColor;
export default CURRENCY_BASE_SEPOLIA;