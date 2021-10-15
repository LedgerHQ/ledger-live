import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.56 20.4h16.8V7.2h-15V9h13.2v9.6h-15c-.12 0-.12 0-.12-.12V5.52c0-.12 0-.12.12-.12h14.88c-.048-1.056-.864-1.8-1.92-1.8H4.56c-1.104 0-1.92.816-1.92 1.92v12.96c0 1.104.816 1.92 1.92 1.92zm10.488-6.48a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default WalletMedium;