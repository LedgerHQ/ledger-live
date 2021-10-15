import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EntitiesLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 21.36h6v-6H5.232v-2.832h6.24v2.832H9v6h6v-6h-2.448v-2.832h6.24v2.832H16.32v6h6v-6h-2.448v-3.912h-7.32V8.64H15v-6H9v6h2.472v2.808h-7.32v3.912H1.68v6zm1.08-1.056v-3.912H6.6v3.912H2.76zm7.32 0v-3.912h3.84v3.912h-3.84zm0-12.72V3.672h3.84v3.912h-3.84zm7.32 12.72v-3.912h3.84v3.912H17.4z"  /></Svg>;
}

export default EntitiesLight;