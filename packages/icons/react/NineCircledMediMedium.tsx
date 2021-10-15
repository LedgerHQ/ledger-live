import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.144 16.704c2.376 0 3.648-1.872 3.624-4.8-.024-2.856-1.368-4.56-3.648-4.56-1.728 0-3.264 1.32-3.264 3.168 0 1.704 1.32 3 2.952 3 .696 0 1.416-.24 1.824-.72h.264c0 1.608-.6 2.256-1.8 2.256-.96 0-1.416-.408-1.488-1.272H8.736c.072 1.776 1.536 2.928 3.408 2.928zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92zm4.992 6.24v-.744c0-.72.384-1.008 1.32-1.008h.24c.936 0 1.32.288 1.32 1.008v.744c0 .72-.384 1.008-1.32 1.008h-.24c-.936 0-1.32-.288-1.32-1.008z"  /></Svg>;
}

export default NineCircledMediMedium;