import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#771A4E";

function R({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.125 18.479l2.6-1.36V8.06l3.714 2.083-2.785 1.45v2.99l6.221 4.168v-2.809l-3.807-2.627 3.157-1.631v-2.9l-6.5-3.533-2.6 1.359v11.87z"  /></Svg>;
}

R.DefaultColor = DefaultColor;
export default R;