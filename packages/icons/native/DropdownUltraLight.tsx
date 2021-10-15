import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropdownUltraLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 14.964l5.328-5.352-.576-.576L12 13.764 7.248 9.036l-.576.576L12 14.964z"  /></Svg>;
}

export default DropdownUltraLight;