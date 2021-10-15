import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LedgerBlueThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.76 21.84h12c1.104 0 1.92-.816 1.92-1.92V8.4h.48V5.04h-.48v-.96c0-1.104-.816-1.92-1.92-1.92h-12c-1.104 0-1.92.816-1.92 1.92v15.84c0 1.104.816 1.92 1.92 1.92zm-1.44-1.92V4.08c0-.912.528-1.44 1.44-1.44h12c.912 0 1.44.528 1.44 1.44v15.84c0 .912-.528 1.44-1.44 1.44h-12c-.912 0-1.44-.528-1.44-1.44zm1.92-.48h11.04V4.56H6.24v14.88zm.48-.48V5.04H16.8v13.92H6.72z"  /></Svg>;
}

export default LedgerBlueThin;