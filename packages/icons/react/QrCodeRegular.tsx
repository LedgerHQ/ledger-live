import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QrCodeRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.464 9.888h6.648V3.24h-6.648v6.648zM2.64 13.08h18.72v-1.488H2.64v1.488zm1.248 7.68h6.648v-6h-1.32v4.68H5.208v-4.68h-1.32v6zm0-10.872h6.648V3.24H3.888v6.648zm1.32-1.32V4.56h4.008v4.008H5.208zm1.272 9.624h1.512v-1.536H6.48v1.536zm0-10.872h1.512V5.808H6.48V7.32zm6.984 13.44h1.512v-1.512h-1.512v1.512zm0-4.488h3.024V14.76h-3.024v1.512zm1.32-7.704V4.56h4.008v4.008h-4.008zm.192 10.68h3v-2.976h-1.488v1.464h-1.512v1.512zM16.032 7.32h1.512V5.808h-1.512V7.32zm2.088 13.44h1.992v-3.024H18.12v3.024z"  /></Svg>;
}

export default QrCodeRegular;