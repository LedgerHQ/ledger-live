import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerMediumMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.008 20.412h15.984a10.231 10.231 0 002.328-6.48c0-4.752-3.264-8.808-7.68-9.984v2.016a8.392 8.392 0 015.76 7.968c0 1.68-.504 3.24-1.368 4.56H4.968a8.288 8.288 0 01-1.368-4.56c0-3.696 2.4-6.864 5.76-7.968V3.948C4.944 5.124 1.68 9.18 1.68 13.932c0 2.448.888 4.728 2.328 6.48zm7.032-6.48c0 .528.432.96.96.96s.96-.432.96-.96V3.588h-1.92v10.344z"  /></Svg>;
}

export default TachometerMediumMedium;