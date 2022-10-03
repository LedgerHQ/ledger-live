import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#23292F";

function XRP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M17.302 5.789h2.168l-4.511 4.468a4.216 4.216 0 01-5.918 0L4.526 5.789h2.171l3.428 3.392a2.667 2.667 0 003.747 0l3.43-3.392zM6.672 18.21H4.5l4.541-4.495a4.216 4.216 0 015.918 0L19.5 18.21h-2.171l-3.454-3.421a2.667 2.667 0 00-3.747 0L6.67 18.21h.001z"  /></Svg>;
}

XRP.DefaultColor = DefaultColor;
export default XRP;