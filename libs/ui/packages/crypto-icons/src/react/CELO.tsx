import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#42d689";
function CELO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M10.105 19.105a5.21 5.21 0 100-10.42 5.21 5.21 0 100 10.42m0 1.895a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21" /><path  d="M13.895 15.316a5.21 5.21 0 100-10.421 5.21 5.21 0 100 10.42m0 1.894a7.105 7.105 0 110-14.21 7.105 7.105 0 010 14.21" /><path  d="M14.13 17.21a5.2 5.2 0 001.032-2.048c.75-.187 1.45-.54 2.048-1.032a7 7 0 01-.553 2.53 7.1 7.1 0 01-2.527.55M8.838 8.839a5.2 5.2 0 00-2.049 1.032c.027-.87.215-1.726.554-2.527A7.1 7.1 0 019.87 6.79a5.2 5.2 0 00-1.032 2.049" /></Svg>;
}
CELO.DefaultColor = DefaultColor;
export default CELO;