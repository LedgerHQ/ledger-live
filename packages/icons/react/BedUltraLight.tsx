import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BedUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.352 18.9h.816v-3.84h17.664v3.84h.816v-7.512c0-1.656-1.248-2.88-2.904-2.88h-7.296v5.712h-8.28V5.1h-.816v13.8zm2.04-8.808a2.92 2.92 0 002.904 2.928 2.91 2.91 0 002.928-2.928 2.904 2.904 0 00-2.928-2.904 2.914 2.914 0 00-2.904 2.904zm.744 0c0-1.2.984-2.16 2.16-2.16 1.224 0 2.184.96 2.184 2.16 0 1.224-.96 2.16-2.184 2.16a2.15 2.15 0 01-2.16-2.16zm7.128 4.128V9.324l6.624-.024c1.2 0 1.944.768 1.944 1.944v2.976h-8.568z"  /></Svg>;
}

export default BedUltraLight;