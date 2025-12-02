import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function KLAY({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M17.125 5.898a8 8 0 00-4.843-1.837L8.203 14.758zm1.018 1.012l-5.124 5.088 5.123 5.086a7.9 7.9 0 000-10.174m-7.864-1.628l-6.261 6.216a7.9 7.9 0 001.784 5.522zM12 13.008l-5.124 5.088a8.04 8.04 0 0010.247-.001z" /></Svg>;
}
KLAY.DefaultColor = DefaultColor;
export default KLAY;