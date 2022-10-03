import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F70000";

function ARK({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.96 10.01l-8.21 8.658L11.997 5.25l8.253 13.5-8.29-8.74zm1.191 3.439h-2.566l1.32-1.452 1.246 1.465v-.013zm-4.95 2.383v-.018l1.456-1.49v-.007l4.44-.019 1.498 1.534H8.203z"  /></Svg>;
}

ARK.DefaultColor = DefaultColor;
export default ARK;