import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LedgerBlueUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.58 21.96h12.24c1.104 0 1.92-.816 1.92-1.92V8.4h.6V5.04h-.6V3.96c0-1.104-.816-1.92-1.92-1.92H5.58c-1.104 0-1.92.816-1.92 1.92v16.08c0 1.104.816 1.92 1.92 1.92zm-1.104-1.896V3.936c0-.696.408-1.08 1.08-1.08h12.288c.696 0 1.08.384 1.08 1.08v16.128c0 .696-.384 1.08-1.08 1.08H5.556c-.672 0-1.08-.384-1.08-1.08zM6.3 19.32h10.8V4.68H6.3v14.64zm.744-.744V5.424h9.312v13.152H7.044z"  /></Svg>;
}

export default LedgerBlueUltraLight;