import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowLeftThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M9.252 18.624l.336-.336L6.42 15.12l-2.88-2.88h17.832v-.48H3.54l2.88-2.88 3.168-3.168-.336-.336L2.628 12l6.624 6.624z"  /></Svg>;
}

export default ArrowLeftThin;