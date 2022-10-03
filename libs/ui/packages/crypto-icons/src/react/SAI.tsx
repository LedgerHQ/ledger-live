import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#B68900";

function SAI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.112 12L12 3.888 3.888 12 12 14.997 20.112 12zm-13.701-.687l5.5-5.624s5.376 5.5 5.603 5.61c.227.11-3.699 0-3.699 0L12 9.443l-1.836 1.87H6.411zM12 15.568l8.111-3.018L12 20.112l-8.112-7.52L12 15.568z"  /></Svg>;
}

SAI.DefaultColor = DefaultColor;
export default SAI;