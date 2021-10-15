import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BarChartThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16.584 20.88h4.296V3.12h-4.296v17.76zm-13.464 0h4.296V7.368H3.12V20.88zm.48-.48V7.848h3.336V20.4H3.6zm6.24.48h4.32V10.824H9.84V20.88zm.48-.48v-9.096h3.36V20.4h-3.36zm6.744 0V3.6H20.4v16.8h-3.336z"  /></Svg>;
}

export default BarChartThin;