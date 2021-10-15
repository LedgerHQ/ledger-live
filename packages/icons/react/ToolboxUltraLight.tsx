import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ToolboxUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 19.86h18v-8.88l-2.4-2.4h-1.776V5.916c0-1.008-.768-1.776-1.752-1.776H8.928c-.984 0-1.752.768-1.752 1.776V8.58H5.4L3 10.98v8.88zm.84-.816v-4.056h4.272v1.608h.816v-1.608h6.144v1.608h.816v-1.608h4.296v4.056H3.84zm0-4.872v-2.856l1.896-1.92h12.528l1.92 1.92v2.856h-4.296v-1.656h-.816v1.656H8.928v-1.656h-.816v1.656H3.84zM7.992 8.58V5.94c0-.624.36-.984.96-.984h6.096c.6 0 .96.36.96.984v2.64H7.992z"  /></Svg>;
}

export default ToolboxUltraLight;