import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UsbMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.916 22.32a2.52 2.52 0 002.52-2.52 2.525 2.525 0 00-1.56-2.328v-2.28l4.344-1.344c.768-.24 1.248-.864 1.248-1.632V8.76h.888V5.4h-3.504v3.36h.936v3.384c0 .072-.048.096-.12.12l-3.792 1.176V6.12h1.728l-2.688-4.44-2.688 4.44h1.728v8.856l-3.384-1.128c-.12-.048-.168-.072-.168-.192v-3.528A1.924 1.924 0 008.484 8.4c0-1.056-.864-1.92-1.92-1.92s-1.92.864-1.92 1.92c0 .744.432 1.416 1.08 1.728V13.8c0 .768.48 1.368 1.224 1.608l4.008 1.344v.72a2.525 2.525 0 00-1.56 2.328 2.52 2.52 0 002.52 2.52z"  /></Svg>;
}

export default UsbMedium;