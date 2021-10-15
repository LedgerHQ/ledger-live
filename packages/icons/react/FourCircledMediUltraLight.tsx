import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.792 11.856v1.8h-3.72l3.456-5.184h.264v3.384zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84zM8.256 14.4h4.536v2.064h.816V14.4h1.464v-.744h-1.464V7.584h-1.32l-4.032 6.048v.768z"  /></Svg>;
}

export default FourCircledMediUltraLight;