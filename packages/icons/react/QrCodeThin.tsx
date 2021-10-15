import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QrCodeThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.824 9.516h5.928V3.588h-5.928v5.928zM2.64 12.564h18.72v-.48H2.64v.48zm1.608 7.848h5.928v-5.376h-.48v4.896H4.728v-4.896h-.48v5.376zm0-10.896h5.928V3.588H4.248v5.928zm.48-.48V4.068h4.968v4.968H4.728zm1.776 9.096h1.44v-1.44h-1.44v1.44zm0-10.848h1.44v-1.44h-1.44v1.44zm7.32 13.104h1.344v-1.344h-1.344v1.344zm0-4.008h2.688v-1.344h-2.688v1.344zm.48-7.344V4.068h4.968v4.968h-4.968zm.864 10.008h2.664V16.38h-1.32v1.32h-1.344v1.344zm.888-11.76h1.44v-1.44h-1.44v1.44zm2.352 13.104h1.344V17.7h-1.344v2.688z"  /></Svg>;
}

export default QrCodeThin;