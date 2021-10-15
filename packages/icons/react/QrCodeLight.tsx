import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QrCodeLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.584 9.756h6.408V3.348h-6.408v6.408zM2.64 12.9h18.72v-1.152H2.64V12.9zm1.368 7.752h6.408v-5.808H9.384v4.752h-4.32v-4.752H4.008v5.808zm0-10.896h6.408V3.348H4.008v6.408zM5.064 8.7V4.38h4.32V8.7h-4.32zm1.416 9.456h1.488v-1.488H6.48v1.488zm0-10.848h1.488V5.796H6.48v1.512zm7.104 13.32h1.464v-1.464h-1.464v1.464zm0-4.344h2.904v-1.44h-2.904v1.44zM14.64 8.7V4.38h4.32V8.7h-4.32zm.408 10.464h2.88v-2.88h-1.44v1.44h-1.44v1.44zm.984-11.856h1.488V5.796h-1.488v1.512zm2.184 13.32h1.776v-2.904h-1.776v2.904z"  /></Svg>;
}

export default QrCodeLight;