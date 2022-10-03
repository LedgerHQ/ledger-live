import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0155FF";

function WAVES({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M12 4.5l7.5 7.5-7.5 7.5L4.5 12 12 4.5z"  /></Svg>;
}

WAVES.DefaultColor = DefaultColor;
export default WAVES;