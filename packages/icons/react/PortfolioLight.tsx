import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PortfolioLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 19.92h18.72v-1.176H3.84V4.08h-1.2v15.84zm2.76-4.536l5.496-5.448 2.88 2.88 7.344-7.344-.816-.816-6.528 6.528-2.88-2.88L5.4 13.752v1.632z"  /></Svg>;
}

export default PortfolioLight;