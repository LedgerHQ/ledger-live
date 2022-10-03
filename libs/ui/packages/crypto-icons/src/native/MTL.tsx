import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1E1F25";

function MTL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M6 6.75h.75v10.5H6V6.75zM9.75 9h.75v6.75h-.75V9zm3.75 1.5h.75v3.75h-.75V10.5zm3.75-3.75H18v10.5h-.75V6.75z"  /></Svg>;
}

MTL.DefaultColor = DefaultColor;
export default MTL;