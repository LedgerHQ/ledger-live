import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketrightThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><g clipPath="url(#prefix__clip0)"><path d="M20.4 3.6V-7.44H3.6v2.448h14.352V3.6H20.4zM3.6 31.44h16.8V20.4h-2.448v8.592H3.6v2.448z"  /></g><defs><clipPath id="prefix__clip0"><path  d="M0 0h24v24H0z" /></clipPath></defs></Svg>;
}

export default BracketrightThin;