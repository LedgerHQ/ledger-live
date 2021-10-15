import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BedMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.22 18.72h1.8v-2.76h15.96v2.76h1.8v-6.624c0-2.208-1.68-3.888-3.888-3.888H12.06v5.832H4.02V5.28h-1.8v13.44zm2.808-8.64a3.001 3.001 0 006 0 3.001 3.001 0 00-6 0zm1.56 0c0-.792.648-1.44 1.44-1.44.792 0 1.44.648 1.44 1.44 0 .792-.648 1.44-1.44 1.44-.792 0-1.44-.648-1.44-1.44zm7.272 3.96v-4.032h4.608c1.032 0 1.512.48 1.512 1.512v2.52h-6.12z"  /></Svg>;
}

export default BedMedium;