import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RewardsMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.184 18.36h13.632v-1.68h-1.584c1.92-1.464 3.048-3.72 3.048-6.24 0-4.56-3.72-8.28-8.28-8.28-4.56 0-8.28 3.72-8.28 8.28 0 2.52 1.128 4.776 3.048 6.24H5.184v1.68zM1.68 21.84h20.64v-7.08H20.4v5.28H3.6v-5.28H1.68v7.08zm3.96-11.4c0-3.504 2.856-6.36 6.36-6.36 3.504 0 6.36 2.856 6.36 6.36 0 3.096-2.232 5.664-5.136 6.24h-2.448c-2.904-.576-5.136-3.144-5.136-6.24z"  /></Svg>;
}

export default RewardsMedium;