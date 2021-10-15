import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UsbLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.964 22.32a1.987 1.987 0 001.992-1.992c0-.864-.6-1.608-1.392-1.872v-3.36l4.344-1.368c.768-.24 1.248-.864 1.248-1.632V8.424h.672v-2.4h-2.472v2.4h.72v3.624c0 .36-.168.552-.504.648l-4.008 1.272v-9.12h1.32l-1.92-3.168-1.92 3.168h1.32v10.8L7.62 14.4c-.36-.12-.528-.312-.528-.672v-3.696c.48-.216.84-.696.84-1.272 0-.744-.624-1.368-1.368-1.368-.768 0-1.392.624-1.392 1.368 0 .576.36 1.056.84 1.272V13.8c0 .768.48 1.368 1.224 1.608l4.128 1.368v1.68c-.792.264-1.368 1.008-1.368 1.872 0 1.104.888 1.992 1.968 1.992z"  /></Svg>;
}

export default UsbLight;