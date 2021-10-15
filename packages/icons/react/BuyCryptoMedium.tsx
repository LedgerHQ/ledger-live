import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BuyCryptoMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 12h1.824V7.008h14.688c-.456.408-.888.792-1.296 1.2L16.8 9.288l1.176 1.176 4.344-4.368-4.344-4.344-1.176 1.2 1.056 1.056c.384.384.816.792 1.248 1.176H2.64V12zm-.96 5.904l4.344 4.344 1.176-1.2-1.056-1.056a29.775 29.775 0 00-1.248-1.176H21.36V12h-1.824v4.992H4.848c.456-.408.888-.792 1.296-1.2l1.056-1.08-1.176-1.176-4.344 4.368z"  /></Svg>;
}

export default BuyCryptoMedium;