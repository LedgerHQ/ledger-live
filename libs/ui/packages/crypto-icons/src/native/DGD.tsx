import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F4D029";

function DGD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M9.375 8.25v2.25h-5.25V8.25h5.25zm.75 0h1.5v7.5h-7.5v-4.5h6v-3zm-4.5 4.5v1.5h4.5v-1.5h-4.5zm14.25-3h-6v4.5h4.5v-1.5h-3v-1.5h4.5v4.5h-7.5v-7.5h7.5v1.5z"  /></Svg>;
}

DGD.DefaultColor = DefaultColor;
export default DGD;