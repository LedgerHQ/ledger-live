import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledCheckUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm4.176 0l3.168 3.192 5.496-5.52-.576-.576-4.92 4.896-2.592-2.568-.576.576z"  /></Svg>;
}

export default CircledCheckUltraLight;