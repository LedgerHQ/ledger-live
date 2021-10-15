import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RefreshLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 11.856v.6h1.2v-.6c0-4.344 3.504-7.776 7.896-7.776 2.784 0 5.232 1.464 6.648 3.648-.72-.024-1.512-.024-2.256-.024H14.28v1.08h6.144V2.64h-1.08v2.088c0 .672 0 1.416.024 2.136-1.752-2.544-4.512-3.984-7.392-3.984-5.04 0-9.096 3.984-9.096 8.976zm.72 9.504h1.08v-2.088c0-.696 0-1.416-.024-2.16 1.752 2.544 4.512 4.008 7.368 4.008 5.064 0 9.096-3.984 9.096-9v-.6h-1.2v.6c0 4.344-3.504 7.8-7.896 7.8-2.76 0-5.208-1.464-6.624-3.672.72.024 1.512.048 2.256.048h2.088v-1.08H3.6v6.144z"  /></Svg>;
}

export default RefreshLight;