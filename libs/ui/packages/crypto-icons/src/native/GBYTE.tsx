import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#302C2C";

function GBYTE({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z"  /><Path d="M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z"  /></Svg>;
}

GBYTE.DefaultColor = DefaultColor;
export default GBYTE;