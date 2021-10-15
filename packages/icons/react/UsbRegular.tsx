import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UsbRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.94 22.32a2.253 2.253 0 002.256-2.256c0-.96-.624-1.776-1.464-2.088v-2.832l4.344-1.368c.768-.24 1.248-.864 1.248-1.632V8.592h.768v-2.88h-2.976v2.88h.816v3.504c0 .216-.096.312-.312.384l-3.888 1.224V5.496h1.512L11.94 1.68 9.636 5.496h1.536v9.816l-3.576-1.2c-.24-.072-.336-.192-.336-.432v-3.6c.552-.264.96-.84.96-1.488a1.66 1.66 0 00-1.656-1.656 1.66 1.66 0 00-1.656 1.656c0 .648.384 1.224.96 1.488v3.72c0 .768.48 1.368 1.224 1.608l4.08 1.344v1.224c-.864.312-1.488 1.128-1.488 2.088a2.253 2.253 0 002.256 2.256z"  /></Svg>;
}

export default UsbRegular;