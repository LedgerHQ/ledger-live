import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function ALGO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M8.115 17.968l1.728-2.989L11.568 12l1.716-2.99.285-.474.126.474.526 1.969-.59 1.021-1.725 2.979-1.716 2.99h2.062l1.727-2.99.895-1.547.421 1.547.8 2.99h1.852l-.8-2.99-.8-2.979-.21-.769 1.284-2.22h-1.873l-.064-.222-.652-2.442-.084-.316h-1.8l-.042.063L11.22 9.01 9.495 12l-1.716 2.979-1.726 2.99h2.062z"  /></Svg>;
}

ALGO.DefaultColor = DefaultColor;
export default ALGO;