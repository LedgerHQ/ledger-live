import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StreamLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 7.152h13.92V5.904H2.64v1.248zm0 10.944h13.92v-1.248H2.64v1.248zm4.8-5.472h13.92v-1.248H7.44v1.248z"  /></Svg>;
}

export default StreamLight;