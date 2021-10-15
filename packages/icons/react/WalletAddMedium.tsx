import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletAddMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 19.92h9.36V6.72h-15v1.8h13.08v9.6H12v1.8zm-9.36-2.232h3.192v3.192h1.8v-3.192H10.8v-1.8H7.632V12.72h-1.8v3.168H2.64v1.8zm0-6.168h1.8V5.04c0-.12 0-.12.12-.12h14.88c-.048-1.056-.864-1.8-1.92-1.8H4.56c-1.104 0-1.92.816-1.92 1.92v6.48zm12.408 1.92a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default WalletAddMedium;