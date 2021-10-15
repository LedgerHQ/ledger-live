import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledInitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.704 16.704c2.376 0 3.648-1.872 3.624-4.8-.024-2.856-1.368-4.56-3.648-4.56-1.728 0-3.264 1.32-3.264 3.168 0 1.704 1.32 3 2.952 3 .696 0 1.416-.24 1.824-.72h.264c0 1.608-.6 2.256-1.8 2.256-.96 0-1.416-.408-1.488-1.272h-1.872c.072 1.776 1.536 2.928 3.408 2.928zM4.2 12c0 5.232 4.128 9.36 9.36 9.36h6.24v-1.92h-6.24c-4.176 0-7.44-3.264-7.44-7.44 0-4.056 3.264-7.44 7.44-7.44h6.24V2.64h-6.24C8.304 2.64 4.2 6.912 4.2 12zm8.112-1.2v-.744c0-.72.384-1.008 1.32-1.008h.24c.936 0 1.32.288 1.32 1.008v.744c0 .72-.384 1.008-1.32 1.008h-.24c-.936 0-1.32-.288-1.32-1.008z"  /></Svg>;
}

export default NineCircledInitMedium;