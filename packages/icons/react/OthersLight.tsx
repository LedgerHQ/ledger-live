import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OthersLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.192 13.104H20.4v-2.208h-2.208v2.208zm-14.592 0h2.208v-2.208H3.6v2.208zm7.296 0h2.208v-2.208h-2.208v2.208z"  /></Svg>;
}

export default OthersLight;