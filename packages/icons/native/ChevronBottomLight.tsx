import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronBottomLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M4.02 7.164l-.84.84 8.808 8.832 8.832-8.832-.84-.84-7.992 7.968L4.02 7.164z"  /></Svg>;
}

export default ChevronBottomLight;