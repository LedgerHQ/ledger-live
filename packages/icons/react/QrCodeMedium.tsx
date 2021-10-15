import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QrCodeMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.344 10.008h6.888V3.12h-6.888v6.888zM2.64 13.224h18.72v-1.8H2.64v1.8zm1.128 7.656h6.888v-6.216H9.048v4.608H5.376v-4.608H3.768v6.216zm0-10.872h6.888V3.12H3.768v6.888zM5.376 8.4V4.728h3.672V8.4H5.376zm1.08 9.816h1.536v-1.56H6.456v1.56zm0-10.872h1.536v-1.56H6.456v1.56zm6.888 13.536h1.56v-1.56h-1.56v1.56zm0-4.656h3.12v-1.56h-3.12v1.56zm1.56 3.096h3.12v1.56h2.208v-3.12h-2.208v-1.536h-1.56v1.536h-1.56v1.56zm.048-10.92V4.728h3.672V8.4h-3.672zm1.056-1.056h1.536v-1.56h-1.536v1.56z"  /></Svg>;
}

export default QrCodeMedium;