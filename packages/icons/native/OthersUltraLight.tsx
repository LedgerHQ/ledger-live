import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OthersUltraLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.576 12.912H20.4v-1.824h-1.824v1.824zm-14.976 0h1.824v-1.824H3.6v1.824zm7.488 0h1.824v-1.824h-1.824v1.824z"  /></Svg>;
}

export default OthersUltraLight;