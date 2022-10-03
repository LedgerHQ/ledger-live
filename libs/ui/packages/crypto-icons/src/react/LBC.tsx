import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#006149";

function LBC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.085 12.904l-.598-.15.182-.727 1.864.466-.465 1.863-.729-.181.162-.647-6.654 4.12-7.38-3.687v-2.814l7.668-4.795 7.032 3.43v1.157l-7.32 4.548-5.435-2.695.333-.672 5.062 2.51 6.61-4.108v-.272L12.18 7.208l-6.962 4.355v1.935l6.59 3.292 6.277-3.886z"  /></Svg>;
}

LBC.DefaultColor = DefaultColor;
export default LBC;