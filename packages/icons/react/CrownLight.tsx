import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CrownLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 16.38h18.24V4.908L15.816 8.94 12 4.14l-3.816 4.8L2.88 4.908V16.38zm0 3.48h18.24v-1.152H2.88v1.152zm1.176-4.632V7.26l4.32 3.288L12 6.012l3.624 4.536 4.32-3.288v7.968H4.056z"  /></Svg>;
}

export default CrownLight;