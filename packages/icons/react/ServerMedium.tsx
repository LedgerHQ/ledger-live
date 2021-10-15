import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ServerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 21.36h7.2V14.4H7.56v-1.56h8.88v1.56h-2.76v6.96h7.2V14.4h-2.76v-3.24h-5.28V9.6h2.76V2.64H8.4V9.6h2.76v1.56H5.88v3.24H3.12v6.96zm1.8-1.68v-3.6h3.6v3.6h-3.6zM10.2 7.92v-3.6h3.6v3.6h-3.6zm5.28 11.76v-3.6h3.6v3.6h-3.6z"  /></Svg>;
}

export default ServerMedium;