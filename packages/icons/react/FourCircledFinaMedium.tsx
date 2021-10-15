import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledFinaMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.344 12.408v.696H8.112l2.256-3.408h.024c-.024.792-.048 1.8-.048 2.712zM4.2 21.36h6.24c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36H4.2v1.92h6.24c4.176 0 7.44 3.264 7.44 7.44 0 4.056-3.264 7.44-7.44 7.44H4.2v1.92zm2.136-6.696h4.008v1.8h1.8v-1.8h1.368v-1.56h-1.368v-5.52h-2.016l-3.792 5.712v1.368z"  /></Svg>;
}

export default FourCircledFinaMedium;