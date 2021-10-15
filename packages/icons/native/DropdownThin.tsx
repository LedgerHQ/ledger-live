import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropdownThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 14.772l5.208-5.208-.336-.336L12 14.1 7.128 9.228l-.336.336L12 14.772z"  /></Svg>;
}

export default DropdownThin;