import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3a4aff";
function EQZ({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M12 21a9 9 0 110-18 9 9 0 010 18M7.14 9.038c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957m4.856 3.873c-2.682 0-4.856-.428-4.856-.957s2.174-.957 4.856-.957 4.856.429 4.856.957c0 .529-2.174.957-4.856.957M7.14 14.963c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957" clipRule="evenodd" /></Svg>;
}
EQZ.DefaultColor = DefaultColor;
export default EQZ;