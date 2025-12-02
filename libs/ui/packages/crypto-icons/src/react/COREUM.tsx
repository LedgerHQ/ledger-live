import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#6dd39a";
function COREUM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 500 500" fill={color}><path  d="M271.88 246.5c0-27.74-23.02-50.13-51.53-50.13-28.52 0-51.7 22.39-51.7 50.13s23.18 50.13 51.7 50.13 51.53-22.39 51.53-50.13M220.35 46c-58.04 0-110.57 23.22-147.93 60.65l75.05 72.18c18.35-18.38 44.2-30.08 72.88-30.08 55.54 0 100.73 43.78 100.73 97.74 0 53.97-45.2 97.74-100.73 97.74-28.19 0-53.87-11.19-72.05-29.57l-74.88 72.85c37.53 36.76 89.23 59.48 146.6 59.48 114.08 0 206.64-89.72 206.64-200.5s-92.23-200.5-206.31-200.5zm0 0" /></Svg>;
}
COREUM.DefaultColor = DefaultColor;
export default COREUM;