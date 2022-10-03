import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function ONG({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M11.982 19.992c4.305 0 7.566-2.885 8.243-6.659h-3.673c-.549 2.004-2.253 3.471-4.526 3.471-2.257 0-3.983-1.477-4.555-3.47H3.775c.652 3.787 3.885 6.658 8.207 6.658z"  /><Path d="M12.003 7.799a1.895 1.895 0 100-3.79 1.895 1.895 0 000 3.79z"  /><Path fillRule="evenodd" clipRule="evenodd" d="M7.266 13.333v-.037c0-2.695 1.93-4.895 4.714-4.895 2.784 0 4.755 2.237 4.76 4.932H7.266z"  /></Svg>;
}

ONG.DefaultColor = DefaultColor;
export default ONG;