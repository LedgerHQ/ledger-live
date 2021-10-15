import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledCheckSolidUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-4.776-9.648l.6-.6 3.36 3.36 5.688-5.688.6.6-6.288 6.288-3.96-3.96z"  /></Svg>;
}

export default CircledCheckSolidUltraLight;