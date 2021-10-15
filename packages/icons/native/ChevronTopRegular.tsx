import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronTopRegular({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M4.152 17.028L12 9.18l7.848 7.848 1.104-1.104L12 6.972l-8.952 8.952 1.104 1.104z"  /></Svg>;
}

export default ChevronTopRegular;