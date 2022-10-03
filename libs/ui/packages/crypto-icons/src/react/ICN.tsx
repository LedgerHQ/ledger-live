import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4C6F8C";

function ICN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 5.25h2v13.5h-2V5.25zM12.667 12h2v6.75h-2V12zM9.333 8.625h2V18.75h-2V8.625zM6 15.375h2v3.375H6v-3.375z"  /></Svg>;
}

ICN.DefaultColor = DefaultColor;
export default ICN;