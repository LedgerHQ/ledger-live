import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#5E4778";

function PIVX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M7.5 9.18h4.615v.942H7.5v-.941zm9 .443c0 2.23-1.582 3.671-3.771 3.671H9.698V18h-1.2v-5.77h4.068c1.631 0 2.696-.969 2.696-2.607 0-1.618-1.065-2.56-2.677-2.56h-1.266l-3.032.01V6h4.432c2.198 0 3.78 1.393 3.78 3.623h.001z"  /></Svg>;
}

PIVX.DefaultColor = DefaultColor;
export default PIVX;