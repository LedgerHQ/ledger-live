import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledSouthWestUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.208 15.792h6.144V15h-2.184c-.864 0-1.728 0-2.616.024l6.264-6.24-.6-.6-6.24 6.264c0-.888.024-1.752.024-2.64l-.024-2.16h-.768v6.144zM3 12c0 5.04 3.96 9 9 9s9-4.104 9-9c0-5.04-3.96-9-9-9s-9 3.96-9 9zm.84 0c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16z"  /></Svg>;
}

export default CircledSouthWestUltraLight;