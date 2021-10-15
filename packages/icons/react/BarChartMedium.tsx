import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BarChartMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16.584 20.88h5.256V3.12h-5.256v17.76zm-14.424 0h5.256V7.368H2.16V20.88zm1.68-1.68V9.048h1.896V19.2H3.84zm5.52 1.68h5.28V10.824H9.36V20.88zm1.68-1.68v-6.696h1.92V19.2h-1.92zm7.224 0V4.8h1.896v14.4h-1.896z"  /></Svg>;
}

export default BarChartMedium;