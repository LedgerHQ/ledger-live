import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletAddRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.06 19.74h9.24V6.66H6.42v1.464h13.32v10.152h-7.68v1.464zM2.7 17.484h3.336v3.336h1.488v-3.336h3.336v-1.488H7.524V12.66H6.036v3.336H2.7v1.488zm.12-5.904h1.464V5.1c0-.312.144-.456.456-.456h14.616c-.12-.864-.864-1.464-1.776-1.464H4.74c-1.104 0-1.92.816-1.92 1.92v6.48zm12.408 1.728c0 .624.504 1.176 1.152 1.176.648 0 1.152-.552 1.152-1.176 0-.624-.504-1.128-1.152-1.128-.648 0-1.152.504-1.152 1.128z"  /></Svg>;
}

export default WalletAddRegular;