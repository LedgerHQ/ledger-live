import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#FFD81B";

function XPM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18 10.921c0 3.318-2.57 4.446-4.732 4.446v.864h1.668v1.172h-1.668v1.347h-2.61v-1.347H9.063v-1.171h1.592v-.877c-.692 0-4.655-.164-4.655-4.674V5.25h2.591v5.639c0 2.354 2.075 2.332 2.075 2.332V5.25h2.602v7.971s2.14.12 2.14-2.365V5.25H18v5.671z"  /></Svg>;
}

XPM.DefaultColor = DefaultColor;
export default XPM;