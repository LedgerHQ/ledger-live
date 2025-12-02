import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#da1157";
function MFT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M15.752 14.27a2.27 2.27 0 100-4.54 2.27 2.27 0 000 4.54m0-7.505a5.235 5.235 0 11-3.753 8.883A5.22 5.22 0 0013.482 12a5.22 5.22 0 00-1.483-3.648 5.22 5.22 0 013.752-1.587M8.248 14.27a2.27 2.27 0 100-4.539 2.27 2.27 0 000 4.54M12 8.352A5.22 5.22 0 0010.518 12 5.22 5.22 0 0012 15.648a5.234 5.234 0 110-7.296M10.517 12c0 1.42.566 2.706 1.483 3.648A5.22 5.22 0 0013.482 12 5.22 5.22 0 0012 8.352 5.22 5.22 0 0010.517 12" /></Svg>;
}
MFT.DefaultColor = DefaultColor;
export default MFT;