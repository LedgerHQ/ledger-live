import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c1.944 0 3.336-1.296 3.336-3.072 0-1.704-1.248-3.048-2.928-3.048-.624 0-1.152.192-1.512.528h-.288l.288-1.896h3.912V7.584h-5.4l-.456 5.16h1.68c.216-.408.528-.552 1.272-.552h.12c1.032 0 1.392.264 1.392 1.08v.672c0 .84-.336 1.104-1.368 1.104h-.12c-1.08 0-1.392-.312-1.44-1.296H8.592c0 1.704 1.44 2.952 3.408 2.952zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92z"  /></Svg>;
}

export default FiveCircledMediMedium;