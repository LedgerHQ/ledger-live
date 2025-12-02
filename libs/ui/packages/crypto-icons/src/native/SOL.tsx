import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function SOL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M2.41 7.77h15.68a.5.5 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.5.5 0 00-.37.16L2.11 7.1a.4.4 0 00.3.67m0 13h15.68a.5.5 0 00.37-.16l3.43-3.67a.4.4 0 00-.3-.67H5.91a.5.5 0 00-.37.16L2.11 20.1a.4.4 0 00.3.67m19.18-6.5H5.91a.5.5 0 01-.37-.16l-3.43-3.67a.4.4 0 01.3-.67h15.68a.5.5 0 01.37.16l3.43 3.67a.4.4 0 01-.3.67" /></Svg>;
}
SOL.DefaultColor = DefaultColor;
export default SOL;