import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledPlusSolidUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-5.376-8.592v-.84h4.944V6.624h.864v4.944h4.944v.84h-4.944v4.968h-.864v-4.968H6.624z"  /></Svg>;
}

export default CircledPlusSolidUltraLight;