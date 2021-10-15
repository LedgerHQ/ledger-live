import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropupUltraLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 9.036l5.328 5.352-.576.576L12 10.236l-4.752 4.728-.576-.576L12 9.036z"  /></Svg>;
}

export default DropupUltraLight;