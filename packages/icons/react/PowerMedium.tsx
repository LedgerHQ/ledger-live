import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PowerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.188 22.344L20.292 9.36h-6.504V1.656L3.708 14.64h6.48v7.704zM7.212 12.96l4.776-6.12v4.2h4.752l-4.752 6.12v-4.2H7.212z"  /></Svg>;
}

export default PowerMedium;