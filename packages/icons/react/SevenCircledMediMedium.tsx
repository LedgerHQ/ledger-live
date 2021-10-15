import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.92 16.464h2.208c.216-3.024 1.2-5.4 3.144-7.368V7.584H9.456V9.24h4.488v.312c-1.776 2.232-2.736 4.44-3.024 6.912zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92z"  /></Svg>;
}

export default SevenCircledMediMedium;