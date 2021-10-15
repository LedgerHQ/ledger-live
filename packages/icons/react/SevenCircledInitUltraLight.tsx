import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.604 16.44h.96c.336-3.192 1.608-5.832 3.72-7.68V7.584h-6.48v.768h5.52v.36c-2.112 2.016-3.36 4.68-3.72 7.728zM4.068 12c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9z"  /></Svg>;
}

export default SevenCircledInitUltraLight;