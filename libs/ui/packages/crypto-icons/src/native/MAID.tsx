import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#5592D7";

function MAID({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M15.975 9.527v9.73l-8.217-4.73c-2.43-1.423-2.276-2.308-2.276-4.23l8.447 4.884v-4.462l2.045-1.192z"  /><Path opacity={0.6} d="M13.93 15.18l-8.447-4.884 8.215-4.73c2.43-1.385 3.125-.808 4.822.154l-8.447 4.884 3.857 2.23v2.347z"  /><Path opacity={0.2} d="M10.073 10.604L18.52 5.72v9.46c0 2.809-.848 3.116-2.545 4.078v-9.73l-3.897 2.23-2.006-1.154z"  /></Svg>;
}

MAID.DefaultColor = DefaultColor;
export default MAID;