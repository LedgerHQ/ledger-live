import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PortfolioUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 19.92h18.72v-.84H3.48v-15h-.84v15.84zm2.352-4.368l5.904-5.856 2.88 2.88L21 5.352l-.576-.576-6.648 6.648-2.88-2.88-5.904 5.88v1.128z"  /></Svg>;
}

export default PortfolioUltraLight;