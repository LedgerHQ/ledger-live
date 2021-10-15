import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoImportMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 9.48h18.72V2.64H2.664L2.64 9.48zM4.32 7.8l.024-3.48H10.2a3.307 3.307 0 00-.48 1.752c0 .624.168 1.224.48 1.728H4.32zm3.312 9.216L12 21.36l4.344-4.344-1.2-1.176-1.056 1.056c-.384.384-.792.816-1.176 1.248V11.04h-1.824v7.152c-.408-.456-.792-.888-1.2-1.296l-1.08-1.056-1.176 1.176zM11.4 6.072c0-.96.792-1.752 1.68-1.752h6.6V7.8h-6.6c-.888 0-1.68-.792-1.68-1.728zm1.008 0c0 .48.408.888.888.888.48 0 .912-.408.912-.888a.927.927 0 00-.912-.912c-.48 0-.888.408-.888.912z"  /></Svg>;
}

export default NanoImportMedium;