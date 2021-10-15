import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.908 16.68c1.872 0 3.24-1.104 3.24-2.664 0-1.008-.576-1.824-1.752-2.136v-.12c1.104-.312 1.488-1.056 1.488-1.872 0-1.464-1.272-2.568-2.952-2.568-1.8 0-3.048 1.248-3.048 2.808v.168h.84c0-1.416.744-2.208 2.208-2.208 1.368 0 2.112.672 2.112 1.848 0 .96-.36 1.536-2.208 1.536h-.696v.768h.696c1.848 0 2.472.624 2.472 1.752 0 1.224-.84 1.896-2.4 1.896-1.632 0-2.328-.768-2.328-2.328h-.84v.12c0 1.728 1.2 3 3.168 3zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21z"  /></Svg>;
}

export default ThreeCircledFinaUltraLight;