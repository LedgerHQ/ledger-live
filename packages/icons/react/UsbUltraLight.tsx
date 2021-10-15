import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UsbUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.988 22.32a1.71 1.71 0 001.704-1.704c0-.792-.552-1.464-1.272-1.656v-3.936l4.344-1.368c.768-.24 1.248-.864 1.248-1.632V8.256h.552v-1.92H16.62v1.92h.6v3.768c0 .456-.216.744-.72.912l-4.08 1.272V4.224h1.104l-1.56-2.544-1.536 2.544h1.152v11.76l-3.936-1.32c-.48-.144-.696-.432-.696-.912V9.984a1.1 1.1 0 00.72-1.032c0-.6-.504-1.104-1.128-1.104-.6 0-1.104.504-1.104 1.104 0 .48.312.888.72 1.032V13.8c0 .768.48 1.368 1.224 1.608l4.2 1.392v2.16a1.721 1.721 0 00-1.296 1.656 1.71 1.71 0 001.704 1.704z"  /></Svg>;
}

export default UsbUltraLight;