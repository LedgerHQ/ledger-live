import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NetworkWiredRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 21.36h7.44v-6H8.016v-2.664h7.968v2.664H12.96v6h7.44v-6h-3.024v-2.664h4.464v-1.392h-9.144V8.64h3.024v-6H8.28v6h3.024v2.664H2.16v1.392h4.464v2.664H3.6v6zm1.392-1.392v-3.24h4.68v3.24h-4.68zm4.68-12.72v-3.24h4.68v3.24h-4.68zm4.68 12.72v-3.24h4.68v3.24h-4.68z"  /></Svg>;
}

export default NetworkWiredRegular;