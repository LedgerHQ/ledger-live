import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BringFrontRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.6 21.24h8.64V12.6h-2.88v1.464h1.416v5.712h-5.712V18.36H12.6v2.88zM2.76 11.4h2.88V9.936H4.224V4.224h5.832V5.64h1.464V2.76H2.76v8.64zm4.92 4.92h8.64V7.68H7.68v8.64zm1.464-1.464V9.144h5.712v5.712H9.144z"  /></Svg>;
}

export default BringFrontRegular;