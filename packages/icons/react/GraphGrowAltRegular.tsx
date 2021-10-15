import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowAltRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.28 20.232H21v-1.536H3.84V4.392H2.28v15.84zm3.192-4.968l4.848-4.8 2.88 2.88 7.2-7.2c-.048.72-.048 1.44-.048 2.136v1.656h1.368l-.024-6.168h-6.144v1.368h1.656c.696 0 1.416 0 2.112-.024l-6.12 6.12-2.88-2.88-4.848 4.824v2.088z"  /></Svg>;
}

export default GraphGrowAltRegular;