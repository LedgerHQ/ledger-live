import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function CLFIL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} fill={color} viewBox="0 0 512 512"><path  d="M379.398 288.735h-58.23c-6.932 37.97-35.354 49.015-61.003 49.015-36.047 0-63.429-28.304-63.429-81.116 0-51.086 27.382-80.426 62.736-80.426 28.075 0 53.377 14.843 59.963 49.015h58.23c-8.665-56.954-53.031-97.684-116.114-97.684-78.333 0-127.551 50.05-127.551 129.095 0 80.081 47.485 129.786 125.818 129.786 63.43 0 110.568-39.695 119.58-97.685" /></Svg>;
}
CLFIL.DefaultColor = DefaultColor;
export default CLFIL;