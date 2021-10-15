import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BarChartRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16.584 20.88H21.6V3.12h-5.016v17.76zm-14.184 0h5.016V7.368H2.4V20.88zm1.392-1.392V8.736h2.256v10.752H3.792zM9.48 20.88h5.04V10.824H9.48V20.88zm1.392-1.392v-7.296h2.28v7.296h-2.28zm7.104 0v-15h2.256v15h-2.256z"  /></Svg>;
}

export default BarChartRegular;