import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#7173ff";
function WOD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 1000 1000" fill={color}><Path  fillRule="evenodd" d="M1000 500A500 500 0 110 500a500 500 0 111000 0M513.421 180h-203.42v650h324.263V723.207h105.737V456.224zm120.843 542.18H415.739V287.82h48.337l170.188 207.425z" /></Svg>;
}
WOD.DefaultColor = DefaultColor;
export default WOD;