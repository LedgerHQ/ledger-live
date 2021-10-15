import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StreamThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 6.768h13.92v-.48H2.64v.48zm0 10.944h13.92v-.48H2.64v.48zm4.8-5.472h13.92v-.48H7.44v.48z"  /></Svg>;
}

export default StreamThin;