import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#ed79aa";
function PINK({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M18.357 6.697l-1.402 1.412a5.43 5.43 0 00-3.864-1.612c-2.937 0-5.333 2.333-5.459 5.258h-.006v5.341A7.5 7.5 0 015.643 12c0-4.142 3.335-7.5 7.448-7.5a7.4 7.4 0 015.266 2.197m0 10.606a7.4 7.4 0 01-5.145 2.197v-1.998a5.43 5.43 0 003.742-1.61z" clipRule="evenodd" opacity={0.5} /><path  fillRule="evenodd" d="M9.529 18.588v-6.833h.005c.105-1.953 1.711-3.505 3.678-3.505 2.034 0 3.683 1.66 3.683 3.71 0 2.048-1.65 3.708-3.682 3.708a3.65 3.65 0 01-1.863-.507v4.133a7.4 7.4 0 01-1.821-.705zm3.683-4.754a1.87 1.87 0 001.862-1.874 1.87 1.87 0 00-1.862-1.876 1.87 1.87 0 00-1.862 1.876c0 1.034.834 1.874 1.862 1.874" clipRule="evenodd" /></Svg>;
}
PINK.DefaultColor = DefaultColor;
export default PINK;