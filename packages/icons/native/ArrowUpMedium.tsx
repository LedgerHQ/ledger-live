import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowUpMedium({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M4.896 20.4L18.768 6.504a42.706 42.706 0 00-.048 1.728v4.776l1.68-.024V3.6h-9.384l-.024 1.68h4.776c.552 0 1.152-.024 1.728-.048L3.6 19.104 4.896 20.4z"  /></Svg>;
}

export default ArrowUpMedium;