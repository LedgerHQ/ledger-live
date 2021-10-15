import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletAddThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.24 19.2h8.88V6.48H6.6v.48h14.04v11.76h-8.4v.48zm-9.36-2.4h3.84v3.84h.48V16.8h3.84v-.48H7.2v-3.84h-.48v3.84H2.88v.48zm.48-5.04h.48V5.28c0-.912.528-1.44 1.44-1.44h13.776c-.336-.312-.792-.48-1.296-.48H5.28c-1.104 0-1.92.816-1.92 1.92v6.48zm12.36 1.176c0 .456.384.864.864.864.432 0 .816-.408.816-.864a.841.841 0 00-.816-.816c-.48 0-.864.384-.864.816z"  /></Svg>;
}

export default WalletAddThin;