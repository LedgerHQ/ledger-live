import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function RAFF({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M20.879 9.834l-2.5-4.332H3.375l2.5 4.332h10.001l-2.5 4.332 2.5 4.332h5.001l-2.5-4.332z" /><Path  d="M8.377 14.166l2.5 4.332 2.5-4.332z" /><Path  d="M10.877 9.834h5l-2.5 4.332z" opacity={0.4} /></Svg>;
}
RAFF.DefaultColor = DefaultColor;
export default RAFF;