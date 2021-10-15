import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OthersUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.576 12.912H20.4v-1.824h-1.824v1.824zm-14.976 0h1.824v-1.824H3.6v1.824zm7.488 0h1.824v-1.824h-1.824v1.824z"  /></Svg>;
}

export default OthersUltraLight;