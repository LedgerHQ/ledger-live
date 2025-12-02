import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#deb69a";
function BERA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M15.93 11.155a1 1 0 01-.035-.154l-.013-.072-.036-.155c.218-.344 1.262-2.14.074-3.293-1.318-1.28-2.859.398-2.859.398l.005.007a3.53 3.53 0 00-2.174-.007c-.009-.01-1.544-1.673-2.858-.398-1.315 1.276.105 3.34.112 3.351a1 1 0 00-.035.148C7.968 11.864 7 12.136 7 13.675s1.013 2.804 3.08 2.804h.85c.003.006.353.522 1.07.521.666 0 1.106-.516 1.11-.52h.81c2.067 0 3.08-1.237 3.08-2.805 0-1.433-.84-1.768-1.07-2.52" /></Svg>;
}
BERA.DefaultColor = DefaultColor;
export default BERA;