import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.5 12.312v4.152h.84v-8.88h-1.512l-3.144 2.928v1.056l3.288-3.072h.528v3.816zM4.068 12c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9z"  /></Svg>;
}

export default OneCircledInitUltraLight;