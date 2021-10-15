import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.468 16.44h.96c.336-3.192 1.608-5.832 3.72-7.68V7.584h-6.48v.768h5.52v.36c-2.112 2.016-3.36 4.68-3.72 7.728zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21z"  /></Svg>;
}

export default SevenCircledFinaUltraLight;