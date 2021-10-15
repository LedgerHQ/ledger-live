import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WindowsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.256 11.64H20.4V3.6l-9.144 1.272v6.768zM3.6 18.096l6.912.936v-6.576H3.6v5.64zm0-6.456h6.912V4.968L3.6 5.904v5.736zm7.656 7.488L20.4 20.4v-7.944h-9.144v6.672z"  /></Svg>;
}

export default WindowsUltraLight;