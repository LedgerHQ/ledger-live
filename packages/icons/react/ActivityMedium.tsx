import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ActivityMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 13.02h4.416l2.136-6.384 5.616 16.824 3.504-10.44h3.048v-2.04h-4.392l-2.16 6.384L9.192.54l-3.48 10.44H2.64v2.04z"  /></Svg>;
}

export default ActivityMedium;