import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#DEC799";

function MONA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.65 10.061l-1.069-4.81-2.098 3.31a10.572 10.572 0 00-4.962 0l-2.092-3.31-1.073 4.81c-1.151.921-1.854 2.125-1.854 3.447 0 2.895 3.357 5.241 7.498 5.241 4.14 0 7.498-2.347 7.498-5.241-.001-1.322-.698-2.526-1.849-3.447zm-9.816 2.202h-.5l1.22-1.407h.889l-1.61 1.407zm4.128 3.438l-2.075-3.654.512-.292.463.813h2.266l.483-.817.507.302-2.156 3.648zm4.21-3.438l-1.61-1.407h.894l1.219 1.407h-.503zm-4.2 2.261l-.775-1.364h1.58l-.805 1.364z"  /></Svg>;
}

MONA.DefaultColor = DefaultColor;
export default MONA;