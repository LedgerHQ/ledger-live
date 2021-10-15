import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NetworkWiredLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 21.36h7.44v-6H7.872v-2.832h8.28v2.832H12.96v6h7.44v-6h-3.168v-2.832h4.608v-1.08h-9.288V8.64h3.168v-6H8.28v6h3.192v2.808H2.16v1.08h4.632v2.832H3.6v6zm1.08-1.08v-3.84h5.28v3.84H4.68zM9.36 7.56V3.72h5.28v3.84H9.36zm4.68 12.72v-3.84h5.28v3.84h-5.28z"  /></Svg>;
}

export default NetworkWiredLight;