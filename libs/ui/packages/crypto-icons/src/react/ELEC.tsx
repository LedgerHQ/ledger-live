import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F90";

function ELEC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.285 20.845l9.5-9.977h-5.75l-3.75 9.977z"  /><path d="M6.215 13.857h5.75l5.82-2.99h-5.75l-5.82 2.99z"  /><path d="M14.848 3.155L6.215 13.857h5.75l2.883-10.702z"  /></Svg>;
}

ELEC.DefaultColor = DefaultColor;
export default ELEC;