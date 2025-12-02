import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#964b9c";
function SHIFT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M15.36 11.997l-3.354 3.353h6.706z" opacity={0.6} /><path  d="M8.625 12l3.354-3.353H5.272z" opacity={0.7} /><path  d="M12.006 15.35l3.345-3.344-3.36-3.362-6.708 6.707 6.707 6.707 6.707-6.707z" opacity={0.4} /><path  d="M12.021 1.942L5.32 8.645h6.66l-3.334 3.334 3.376 3.376 6.707-6.706z" opacity={0.8} /></Svg>;
}
SHIFT.DefaultColor = DefaultColor;
export default SHIFT;