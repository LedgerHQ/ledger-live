import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.004 12.72v3.744h1.2v-8.88h-1.752l-3.024 2.808v1.44l3.144-2.904h.48c0 .624-.048 2.088-.048 3.792zm-6.888 8.4h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2z"  /></Svg>;
}

export default OneCircledFinaLight;