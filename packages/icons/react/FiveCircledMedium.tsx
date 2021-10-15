import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36 0 5.232 4.128 9.36 9.36 9.36zM4.56 12c0-4.176 3.264-7.44 7.44-7.44s7.44 3.264 7.44 7.44c0 4.056-3.264 7.44-7.44 7.44S4.56 16.176 4.56 12zm4.032 1.752c0 1.704 1.44 2.952 3.408 2.952 1.944 0 3.336-1.296 3.336-3.072 0-1.704-1.248-3.048-2.928-3.048-.624 0-1.152.192-1.512.528h-.288l.288-1.896h3.912V7.584h-5.4l-.456 5.16h1.68c.216-.408.528-.552 1.272-.552h.12c1.032 0 1.392.264 1.392 1.08v.672c0 .84-.336 1.104-1.368 1.104h-.12c-1.08 0-1.392-.312-1.44-1.296H8.592z"  /></Svg>;
}

export default FiveCircledMedium;