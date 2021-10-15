import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.504 12.024v1.44H9.288l3.048-4.584h.192c-.024.984-.024 2.088-.024 3.144zM5.76 21.12h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2zm2.376 10.416h4.368v1.968h1.128v-1.968h1.44v-1.032h-1.44v-5.88h-1.536l-3.96 5.928v.984z"  /></Svg>;
}

export default FourCircledMediLight;