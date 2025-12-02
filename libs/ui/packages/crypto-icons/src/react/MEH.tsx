import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function MEH({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M8.253 14.553a.5.5 0 01.5-.5h6.751a.5.5 0 110 1H8.753a.5.5 0 01-.5-.5m0-5.115a.5.5 0 01.5-.5h1.688a.5.5 0 010 1H8.753a.5.5 0 01-.5-.5m5.063 0a.5.5 0 01.5-.5h1.688a.5.5 0 110 1h-1.688a.5.5 0 01-.5-.5" clipRule="evenodd" /><path  fillRule="evenodd" d="M3.139 12a8.99 8.99 0 1117.98 0 8.99 8.99 0 01-17.98 0m8.99-7.99a7.99 7.99 0 100 15.98 7.99 7.99 0 000-15.98" clipRule="evenodd" /></Svg>;
}
MEH.DefaultColor = DefaultColor;
export default MEH;