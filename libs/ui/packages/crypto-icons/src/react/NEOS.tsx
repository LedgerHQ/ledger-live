import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#e5f300";
function NEOS({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M7.875 7.019l6.107 3.694v2.323L9.697 10.46v9.04H7.875zm8.25 9.963l-6.107-3.695v-2.322l4.285 2.575V4.5h1.822z" clipRule="evenodd" /></Svg>;
}
NEOS.DefaultColor = DefaultColor;
export default NEOS;