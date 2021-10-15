import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BarChartUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16.584 20.88h4.536V3.12h-4.536v17.76zm-13.704 0h4.536V7.368H2.88V20.88zm.792-.792V8.136h2.976v11.952H3.672zm6.048.792h4.56V10.824H9.72V20.88zm.792-.792v-8.496h3v8.496h-3zm6.864 0v-16.2h2.976v16.2h-2.976z"  /></Svg>;
}

export default BarChartUltraLight;