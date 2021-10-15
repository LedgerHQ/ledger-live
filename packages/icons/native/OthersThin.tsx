import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OthersThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.96 12.72h1.44v-1.44h-1.44v1.44zm-15.36 0h1.44v-1.44H3.6v1.44zm7.68 0h1.44v-1.44h-1.44v1.44z"  /></Svg>;
}

export default OthersThin;