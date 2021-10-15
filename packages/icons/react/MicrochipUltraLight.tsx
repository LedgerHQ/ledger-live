import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MicrochipUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.136 21h.768v-3.36h2.712V21h.768v-3.36h2.712V21h.768v-3.36h1.776v-1.776H21v-.768h-3.36v-2.712H21v-.768h-3.36V8.904H21v-.768h-3.36V6.36h-1.776V3h-.768v3.36h-2.712V3h-.768v3.36H8.904V3h-.768v3.36H6.36v1.776H3v.768h3.36v2.712H3v.768h3.36v2.712H3v.768h3.36v1.776h1.776V21zm-.96-4.176V7.176h9.648v9.648H7.176zm2.568-2.568h4.512V9.744H9.744v4.512zm.72-.72v-3.072h3.072v3.072h-3.072z"  /></Svg>;
}

export default MicrochipUltraLight;