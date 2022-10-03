import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function BSD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M21 11.386H3L13.473 7.87l1.472-4.828L21 11.386zM3.082 12.532h17.835l-10.472 3.436-1.472 4.991-5.891-8.427z"  /></Svg>;
}

BSD.DefaultColor = DefaultColor;
export default BSD;