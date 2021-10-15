import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QrCodeUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.704 9.636h6.168V3.468h-6.168v6.168zM2.64 12.732h18.72v-.816H2.64v.816zm1.488 7.8h6.168V14.94h-.768v4.824H4.896V14.94h-.768v5.592zm0-10.896h6.168V3.468H4.128v6.168zm.768-.768V4.236h4.632v4.632H4.896zm1.608 9.288h1.464v-1.488H6.504v1.488zm0-10.872h1.464V5.82H6.504v1.464zm7.2 13.224h1.392v-1.392h-1.392v1.392zm0-4.176h2.808V14.94h-2.808v1.392zm.768-7.464V4.236h4.632v4.632h-4.632zm.624 10.248h2.784v-2.784h-1.368V17.7h-1.416v1.416zm.96-11.832h1.464V5.82h-1.464v1.464zm2.256 13.224h1.56V17.7h-1.56v2.808z"  /></Svg>;
}

export default QrCodeUltraLight;