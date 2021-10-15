import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropupMedium({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 8.46l5.712 5.736-1.344 1.344L12 11.196 7.632 15.54l-1.344-1.344L12 8.46z"  /></Svg>;
}

export default DropupMedium;