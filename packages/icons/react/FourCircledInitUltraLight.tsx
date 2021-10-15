import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.86 11.856v1.8h-3.72l3.456-5.184h.264v3.384zM4.068 12c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9zm5.256 2.4h4.536v2.064h.816V14.4h1.464v-.744h-1.464V7.584h-1.344l-4.008 6.048v.768z"  /></Svg>;
}

export default FourCircledInitUltraLight;