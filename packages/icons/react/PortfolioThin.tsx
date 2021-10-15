import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PortfolioThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 19.92h18.72v-.48H3.12V4.08h-.48v15.84zm1.92-4.176l6.336-6.288 2.88 2.88 7.104-7.104-.336-.336-6.768 6.768-2.88-2.88-6.336 6.288v.672z"  /></Svg>;
}

export default PortfolioThin;