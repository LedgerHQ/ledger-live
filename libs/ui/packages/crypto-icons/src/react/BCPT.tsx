import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#404040";

function BCPT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-.826a7.424 7.424 0 10-.001-14.848A7.424 7.424 0 0012 19.424zM16.532 9.09c.124 2.204-1.912 2.786-1.912 2.786 2.327.332 2.203 2.328 2.203 2.328 0 3.241-3.617 3.368-3.617 3.368H8.134V6.429h4.573c3.825.167 3.825 2.661 3.825 2.661zm-5.78-.665v2.701h1.83s1.29-.041 1.372-1.08V9.38s0-.872-1.248-.955h-1.953zm3.45 6.112v-.666s0-.873-1.246-.957h-2.204v2.704h2.08s1.288-.041 1.371-1.082v.001z"  /></Svg>;
}

BCPT.DefaultColor = DefaultColor;
export default BCPT;