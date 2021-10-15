import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DownloadMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 21.84h20.64v-8.4h-5.04l-1.92 1.92h5.04v4.68H3.6v-4.68h5.04l-1.92-1.92H1.68v8.4zm3.36-3.288h1.68v-1.68H5.04v1.68zm2.592-6.816L12 16.08l4.344-4.344-1.2-1.176-1.056 1.056c-.384.384-.792.816-1.176 1.248V2.16h-1.824v10.752c-.408-.456-.792-.888-1.2-1.296l-1.08-1.056-1.176 1.176z"  /></Svg>;
}

export default DownloadMedium;