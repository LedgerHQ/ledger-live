import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WarningMedium({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M1.68 21.36h20.64L12 2.64 1.68 21.36zm3.144-1.8L12 6.552l7.176 13.008H4.824zm6.024-1.32h2.256v-2.256h-2.256v2.256zm.168-5.976l.216 2.352h1.512l.24-2.352v-1.896h-1.968v1.896z"  /></Svg>;
}

export default WarningMedium;