import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledCrossSolidUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-4.416-5.16L11.4 12 7.584 8.16l.576-.576L12 11.4l3.84-3.816.576.576L12.6 12l3.816 3.84-.576.576L12 12.6l-3.84 3.816-.576-.576z"  /></Svg>;
}

export default CircledCrossSolidUltraLight;