import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function LPT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M10.669 16.49h2.63v2.632h-2.63V16.49zm0-11.612h2.63V7.51h-2.63V4.88zm6.2 0H19.5V7.51h-2.631V4.88zm-12.369 0h2.631V7.51H4.5V4.88zm9.268 5.807H16.4v2.63h-2.63v-2.63zm-6.206 0h2.631v2.63h-2.63v-2.63z"  /></Svg>;
}

LPT.DefaultColor = DefaultColor;
export default LPT;