import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesAltUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.764 19.92h7.44v-.792H9.54l.696-3.288h1.968v-.816H3.948c-.6 0-1.008-.408-1.008-1.008V4.92c0-.6.408-.984 1.008-.984h15.024c.6 0 1.008.384 1.008.984v1.2h.84v-1.2c0-.984-.816-1.8-1.8-1.8H3.9c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.544l-.696 3.288H6.18c-.6 0-1.152.336-1.416.792zm9.096-.84c0 .984.816 1.8 1.8 1.8h4.44c.984 0 1.8-.816 1.8-1.8V9.6c0-.984-.816-1.8-1.8-1.8h-4.44c-.984 0-1.8.816-1.8 1.8v9.48zm.816.024V9.576c0-.6.408-1.008 1.008-1.008H20.1c.6 0 .984.408.984 1.008v9.528c0 .6-.384 1.008-.984 1.008h-4.416c-.6 0-1.008-.408-1.008-1.008zm2.424-.792c0 .432.336.792.792.792.432 0 .768-.36.768-.792a.758.758 0 00-.768-.768c-.456 0-.792.336-.792.768z"  /></Svg>;
}

export default DevicesAltUltraLight;