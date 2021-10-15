import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.24 22.32l4.08-4.08L5.76 1.68 1.68 5.76l16.56 16.56zM2.352 5.76L5.76 2.352l7.68 7.68a2.904 2.904 0 00-2.616.768 2.9 2.9 0 00-.792 2.64l-7.68-7.68zm8.784 8.76c-.912-.912-.912-2.424.024-3.384.936-.912 2.448-.912 3.36 0l7.128 7.104-3.408 3.408-7.104-7.128zm.288-1.656c0 .792.648 1.44 1.44 1.44.792 0 1.44-.648 1.44-1.44 0-.792-.648-1.44-1.44-1.44-.792 0-1.44.648-1.44 1.44zm.48 0c0-.528.432-.96.96-.96s.96.432.96.96-.432.96-.96.96a.963.963 0 01-.96-.96z"  /></Svg>;
}

export default NanoThin;