import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.432 12.312v4.152h.84v-8.88H11.76l-3.144 2.928v1.056l3.288-3.072h.528v3.816zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84z"  /></Svg>;
}

export default OneCircledMediUltraLight;