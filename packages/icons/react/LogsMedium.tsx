import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LogsMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 13.548h18.72v-1.92H2.64v1.92zm0 5.52h13.92v-1.92H2.64v1.92zm0-9.864l3.432-2.136L2.64 4.932v4.272zm5.28-1.176h13.44v-1.92H7.92v1.92z"  /></Svg>;
}

export default LogsMedium;