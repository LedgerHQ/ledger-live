import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#186c9d";
function NMC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M14.446 17.625v-.002q.175.004.344-.037c.657-.154 1.213-.727 1.345-1.347l2.615-9.822-2.079-.01-1.714 6.426-4.635-6.448-.003.003.002-.008-.766-.005a1.4 1.4 0 00-.344.037c-.656.155-1.212.729-1.345 1.348L5.25 17.584l2.08.009 1.713-6.426 4.636 6.448h.002zM9.5 9.455l.362-1.358 4.636 6.45-.362 1.357-4.635-6.45z" /></Svg>;
}
NMC.DefaultColor = DefaultColor;
export default NMC;