import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#ffe600";
function WPR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M2.632 4.384A12 12 0 014.619 2.58L7.96 14.52l1.477-6.33h2.805l1.479 6.329 1.753-6.329h2.812l.026.113 3.055 11.035a12 12 0 01-1.912 2.082l-2.578-9.308-1.47 5.309-.026.112h-3.14l-1.402-5.199-1.402 5.2h-3.14l-.026-.113z" clipRule="evenodd" /></Svg>;
}
WPR.DefaultColor = DefaultColor;
export default WPR;