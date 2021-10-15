import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BedLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.304 18.852h1.152v-3.504h17.088v3.504h1.152v-7.224c0-1.848-1.392-3.24-3.216-3.24l-6.816.024v5.736H3.456v-9H2.304v13.704zm2.304-8.76A2.93 2.93 0 007.56 13.02c1.608 0 2.952-1.296 2.952-2.928A2.965 2.965 0 007.56 7.14a2.95 2.95 0 00-2.952 2.952zm1.032 0c0-1.08.864-1.92 1.92-1.92s1.92.84 1.92 1.92c0 1.056-.864 1.92-1.92 1.92a1.926 1.926 0 01-1.92-1.92zm7.152 4.056V9.54h5.976c1.128 0 1.8.672 1.8 1.8l-.024 2.808h-7.752z"  /></Svg>;
}

export default BedLight;