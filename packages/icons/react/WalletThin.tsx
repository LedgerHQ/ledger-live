import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.04 19.92h15.84V7.2H6.36v.48H20.4v11.76H5.04c-.912 0-1.44-.528-1.44-1.44V6c0-.912.528-1.44 1.44-1.44h13.776c-.336-.312-.792-.48-1.296-.48H5.04c-1.104 0-1.92.816-1.92 1.92v12c0 1.104.816 1.92 1.92 1.92zm10.44-6.264c0 .456.384.864.864.864.432 0 .816-.408.816-.864a.841.841 0 00-.816-.816c-.48 0-.864.384-.864.816z"  /></Svg>;
}

export default WalletThin;