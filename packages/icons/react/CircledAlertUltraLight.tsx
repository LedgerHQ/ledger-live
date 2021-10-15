import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledAlertUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.616 13.704h.768l.048-3.48V6.768h-.864v3.456l.048 3.48zM3 12c0 5.04 3.96 9 9 9s9-4.104 9-9c0-5.04-3.96-9-9-9s-9 3.96-9 9zm.84 0c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm7.344 4.92h1.656v-1.656h-1.656v1.656z"  /></Svg>;
}

export default CircledAlertUltraLight;