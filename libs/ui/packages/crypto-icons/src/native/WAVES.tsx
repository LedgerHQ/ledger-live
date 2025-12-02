import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0155ff";
function WAVES({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M12 4.5l7.5 7.5-7.5 7.5L4.5 12z" clipRule="evenodd" /></Svg>;
}
WAVES.DefaultColor = DefaultColor;
export default WAVES;