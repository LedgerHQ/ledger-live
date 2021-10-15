import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketsLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.68 10.2h1.2V3.12H13.8v1.2h5.88v5.88zM3.12 20.88h7.08v-1.224H4.32v-5.88h-1.2v7.104zm0-10.68h1.2V4.32h5.88v-1.2H3.12v7.08zM13.8 20.88h7.08V13.8h-1.2v5.88H13.8v1.2z"  /></Svg>;
}

export default BracketsLight;