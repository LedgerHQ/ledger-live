import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3066ff";
function MEX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M17.6 10.3L10.3 20l1.3-6.3H6.4L13.7 4l-1.4 6.3z" clipRule="evenodd" /></Svg>;
}
MEX.DefaultColor = DefaultColor;
export default MEX;