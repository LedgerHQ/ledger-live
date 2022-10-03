import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00DCFA";

function GUSD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M14.534 3.75c-2.903 0-5.368 2.232-5.678 5.105-2.875.31-5.106 2.776-5.106 5.678a5.72 5.72 0 005.716 5.717c2.903 0 5.378-2.232 5.678-5.105 2.874-.31 5.106-2.776 5.106-5.678a5.72 5.72 0 00-5.716-5.717zm4.376 6.357a4.447 4.447 0 01-3.727 3.728v-3.728h3.727zM5.09 13.893a4.448 4.448 0 013.727-3.737v3.727H5.089v.01zm8.754 1.29a4.42 4.42 0 01-4.377 3.776 4.42 4.42 0 01-4.378-3.775h8.755v-.001zm.049-5.076v3.776h-3.786v-3.776h3.786zm5.017-1.29h-8.754a4.42 4.42 0 014.377-3.776 4.42 4.42 0 014.377 3.775v.001z"  /></Svg>;
}

GUSD.DefaultColor = DefaultColor;
export default GUSD;