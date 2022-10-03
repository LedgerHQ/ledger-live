import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3A4AFF";

function EQZ({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M12 21a9 9 0 110-18 9 9 0 010 18zM7.14 9.038c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957c0-.528-2.174-.957-4.856-.957s-4.856.429-4.856.957zm4.856 3.873c-2.682 0-4.856-.428-4.856-.957 0-.528 2.174-.957 4.856-.957s4.856.429 4.856.957c0 .529-2.174.957-4.856.957zm-4.856 2.052c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957c0-.528-2.174-.957-4.856-.957s-4.856.429-4.856.957z"  /></Svg>;
}

EQZ.DefaultColor = DefaultColor;
export default EQZ;