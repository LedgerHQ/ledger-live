import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.724 11.856v1.8h-3.72l3.456-5.184h.264v3.384zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21zm3.12-6.6h4.536v2.064h.816V14.4h1.464v-.744H12.54V7.584h-1.32l-4.032 6.048v.768z"  /></Svg>;
}

export default FourCircledFinaUltraLight;