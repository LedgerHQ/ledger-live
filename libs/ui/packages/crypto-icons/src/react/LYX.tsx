import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#131313";
function LYX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" strokeMiterlimit={10} fill={color}><path  d="M18.53 6.511l-5.076-2.933c-.9-.52-2.008-.52-2.908 0L5.471 6.51a2.91 2.91 0 00-1.454 2.523v5.87c0 1.04.554 2.002 1.454 2.522l5.075 2.934c.9.52 2.008.52 2.908 0l5.075-2.934a2.91 2.91 0 001.454-2.523V9.034a2.91 2.91 0 00-1.454-2.523m-2.503 6.04l-1.51 2.618c-.207.36-.59.583-1.007.583h-3.02c-.416 0-.8-.222-1.007-.583l-1.51-2.618a1.17 1.17 0 010-1.164l1.51-2.618a1.16 1.16 0 011.007-.584h3.02c.416 0 .8.223 1.007.584l1.51 2.618c.207.358.207.803 0 1.164" /></Svg>;
}
LYX.DefaultColor = DefaultColor;
export default LYX;