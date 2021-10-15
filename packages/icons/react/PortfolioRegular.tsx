import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PortfolioRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 19.92h18.72v-1.536H4.2V4.08H2.64v15.84zm3.192-4.728l5.064-5.016 2.88 2.88 7.464-7.464-1.056-1.056-6.408 6.408-2.88-2.88-5.064 5.04v2.088z"  /></Svg>;
}

export default PortfolioRegular;