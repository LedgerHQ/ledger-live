import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSAltLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.82 20.04L4.428 9.648l3.864-3.864 10.392 10.392c.6.576.864 1.248.864 1.992a2.75 2.75 0 01-2.736 2.736c-.72 0-1.416-.288-1.992-.864zm-12-10.392l10.392 10.416v1.776h7.248v-9.816h.72V9.528h-.72v-2.76h.72V4.296h-.72V2.16h-7.08v7.104L8.292 4.176 2.82 9.648zm12.456 8.496c0 .84.672 1.56 1.536 1.56.84 0 1.512-.72 1.512-1.56 0-.84-.672-1.512-1.512-1.512-.864 0-1.536.672-1.536 1.512z"  /></Svg>;
}

export default NanoSAltLight;