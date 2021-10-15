import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.352 16.44h.96c.336-3.192 1.608-5.832 3.72-7.68V7.584h-6.48v.768h5.52v.36c-2.112 2.016-3.36 4.68-3.72 7.728zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84z"  /></Svg>;
}

export default SevenCircledMediUltraLight;