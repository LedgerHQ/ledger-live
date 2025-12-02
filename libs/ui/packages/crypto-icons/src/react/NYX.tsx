import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#f35135";
function NYX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 32 32" fill={color}><path  stroke="#fff" strokeWidth={0.5} d="M31.75 16c0 8.699-7.052 15.75-15.75 15.75S.25 24.698.25 16 7.302.25 16 .25 31.75 7.302 31.75 16z" /><path  d="M23.069 8.931c-3.899-3.908-10.237-3.908-14.138 0-3.908 3.909-3.908 10.238 0 14.138 3.909 3.908 10.238 3.908 14.138 0 3.908-3.899 3.908-10.24 0-14.138m-.86 13.278c-3.429 3.428-9 3.428-12.428 0s-3.428-9 0-12.428 9-3.428 12.428 0c3.44 3.439 3.44 9 0 12.428" /><path  d="M21.399 21.83V10.172a8 8 0 00-1.69-1.23V20.09L12.352 8.902a7.8 7.8 0 00-1.75 1.26V21.83a8 8 0 001.69 1.23V11.913L19.65 23.1a8 8 0 001.749-1.27" /></Svg>;
}
NYX.DefaultColor = DefaultColor;
export default NYX;