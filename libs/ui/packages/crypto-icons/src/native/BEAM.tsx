import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0B76FF";

function BEAM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M20.67 10.238v-1.65l-5.37 3.127L11.985 6v3.75l1.688 2.925-.683.405-1.005-1.77-1.08 1.92-.75-.308 1.83-3.172V6l-3.63 6.18L3.3 10.088V12l4.5 1.11L4.95 18h7.035v-2.018H8.392l1.343-2.354.81.202-.81 1.425h4.5l-.675-1.193.893-.067 1.147 1.988h-3.615V18h7.065l-2.43-4.148 4.08-.3v-1.657l-4.59 1.133 4.582-1.178v-1.5l-4.972 2.018 4.95-2.13zM14.145 13.5l-.81.203.795-.203h.015zm-.255-.45l-.75.3.75-.307v.007z"  /></Svg>;
}

BEAM.DefaultColor = DefaultColor;
export default BEAM;