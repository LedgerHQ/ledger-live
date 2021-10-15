import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function InfoUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.384 17.04h5.16v-.744H12.48v-6.072H9.624v.744h2.04v5.328h-2.28v.744zM3 12c0 5.04 3.96 9 9 9s9-4.104 9-9c0-5.04-3.96-9-9-9s-9 3.96-9 9zm.84 0c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm7.296-3.6h1.656V6.744h-1.656V8.4z"  /></Svg>;
}

export default InfoUltraLight;