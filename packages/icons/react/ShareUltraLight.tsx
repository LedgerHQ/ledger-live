import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShareUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.96 20.46h16.08v-8.64h-3.72v.84h2.88v6.96H4.8v-6.96h2.88v-.84H3.96v8.64zM7.656 7.884l.552.552 1.68-1.68c.552-.552 1.152-1.152 1.704-1.728V16.5h.816V5.004c.576.6 1.152 1.176 1.728 1.752l1.68 1.68.528-.552L12 3.54 7.656 7.884z"  /></Svg>;
}

export default ShareUltraLight;