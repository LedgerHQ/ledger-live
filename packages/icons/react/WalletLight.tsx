import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.8 20.16h16.32V7.2H6.36v1.128h13.632v10.68H4.8c-.504 0-.768-.264-.768-.768V5.76c0-.528.264-.792.768-.792h14.328c-.192-.672-.816-1.128-1.608-1.128H4.8c-1.104 0-1.92.816-1.92 1.92v12.48c0 1.104.816 1.92 1.92 1.92zm10.464-6.384c0 .576.48 1.08 1.08 1.08.552 0 1.032-.504 1.032-1.08 0-.552-.48-1.032-1.032-1.032-.6 0-1.08.48-1.08 1.032z"  /></Svg>;
}

export default WalletLight;