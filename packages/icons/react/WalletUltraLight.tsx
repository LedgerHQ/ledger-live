import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.92 20.04H21V7.2H6.36v.816h13.824v11.208H4.92c-.72 0-1.104-.384-1.104-1.104V5.88c0-.72.384-1.104 1.104-1.104h14.064c-.264-.504-.816-.816-1.464-.816H4.92C3.816 3.96 3 4.776 3 5.88v12.24c0 1.104.816 1.92 1.92 1.92zm10.464-6.312c0 .504.408.96.96.96.504 0 .912-.456.912-.96s-.408-.936-.912-.936a.943.943 0 00-.96.936z"  /></Svg>;
}

export default WalletUltraLight;