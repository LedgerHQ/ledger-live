import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#345D9D";

function LTC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M7.82 14.41l-1.07.416.516-2.07 1.083-.434L9.909 6h3.848l-1.14 4.647 1.058-.428-.51 2.062-1.07.428-.636 2.613h5.791L16.595 18H6.94l.881-3.59z"  /></Svg>;
}

LTC.DefaultColor = DefaultColor;
export default LTC;