import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#23B852";

function XZC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M14.044 14.361h2.542v2.223H8.948l9.482-9.489a1.101 1.101 0 00.24-1.18 1.09 1.09 0 00-1.008-.665H6.339A1.08 1.08 0 005.25 6.339v8.022l4.706-4.71H7.414V7.416h7.626l-9.47 9.489a1.1 1.1 0 00-.24 1.18 1.09 1.09 0 001.008.665h11.325a1.086 1.086 0 001.087-1.089v-8.01l-4.706 4.71z"  /></Svg>;
}

XZC.DefaultColor = DefaultColor;
export default XZC;