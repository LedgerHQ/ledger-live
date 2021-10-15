import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.68 20.28h16.56V7.2H6.36v1.464h13.416v10.152H4.68c-.312 0-.456-.144-.456-.456V5.64c0-.312.144-.456.456-.456h14.616c-.12-.864-.864-1.464-1.776-1.464H4.68c-1.104 0-1.92.816-1.92 1.92v12.72c0 1.104.816 1.92 1.92 1.92zm10.488-6.432c0 .624.504 1.176 1.152 1.176.648 0 1.152-.552 1.152-1.176 0-.624-.504-1.128-1.152-1.128-.648 0-1.152.504-1.152 1.128z"  /></Svg>;
}

export default WalletRegular;