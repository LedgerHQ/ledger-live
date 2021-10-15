import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MicrochipLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.992 21.12h1.08v-3.36h2.4v3.36h1.08v-3.36h2.4v3.36h1.08v-3.36h1.728v-1.752h3.36v-1.08h-3.36v-2.4h3.36v-1.08h-3.36v-2.4h3.36v-1.08h-3.36V6.24h-1.728V2.88h-1.08v3.36h-2.4V2.88h-1.08v3.36h-2.4V2.88h-1.08v3.36H6.24v1.728H2.88v1.08h3.36v2.4H2.88v1.08h3.36v2.4H2.88v1.08h3.36v1.752h1.752v3.36zm-.6-4.512v-9.24h9.24v9.24h-9.24zm2.64-2.64h3.96v-3.96h-3.96v3.96z"  /></Svg>;
}

export default MicrochipLight;