import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronLeftLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M16.836 19.968L8.868 12l7.968-7.992-.84-.84L7.164 12l8.832 8.832.84-.864z"  /></Svg>;
}

export default ChevronLeftLight;