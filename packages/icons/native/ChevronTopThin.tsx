import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronTopThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M3.768 16.452L12 8.22l8.232 8.232.336-.336L12 7.548l-8.568 8.568.336.336z"  /></Svg>;
}

export default ChevronTopThin;