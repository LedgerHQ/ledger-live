import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.24 12.72v3.744h1.2v-8.88h-1.752l-3.024 2.808v1.44l3.144-2.904h.48c0 .624-.048 2.088-.048 3.792zm-6.48 8.4h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2z"  /></Svg>;
}

export default OneCircledMediLight;