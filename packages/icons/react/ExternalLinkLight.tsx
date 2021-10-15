import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExternalLinkLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 21.12l16.32-.024V12H18v7.896l-13.92.024V6H12V4.8H2.88v16.32zm7.896-8.712l.816.816 8.496-8.496a78.481 78.481 0 00-.048 2.352l.024 1.968h1.056V2.88h-6.144v1.08h1.968c.744 0 1.536 0 2.304-.024l-8.472 8.472z"  /></Svg>;
}

export default ExternalLinkLight;