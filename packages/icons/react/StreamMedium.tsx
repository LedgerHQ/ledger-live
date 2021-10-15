import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StreamMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 7.548h13.92v-2.04H2.64v2.04zm0 10.944h13.92v-2.04H2.64v2.04zm4.8-5.472h13.92v-2.04H7.44v2.04z"  /></Svg>;
}

export default StreamMedium;