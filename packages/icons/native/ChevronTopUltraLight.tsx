import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronTopUltraLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M3.888 16.644L12 8.556l8.112 8.088.576-.576L12 7.356l-8.688 8.712.576.576z"  /></Svg>;
}

export default ChevronTopUltraLight;