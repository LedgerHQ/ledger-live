import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoXFoldedMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.92 21.36h16.032c2.256 0 4.128-1.872 4.128-4.152 0-1.056-.384-2.064-1.08-2.784L9.24 2.64 3.504 8.376l4.728 4.704H1.92v8.28zm1.8-1.8v-4.68h14.232a2.346 2.346 0 012.328 2.328c0 1.296-1.056 2.352-2.328 2.352H3.72zM6.048 8.376L9.24 5.184l7.872 7.896H10.776L6.048 8.376zm2.016.072A1.28 1.28 0 009.336 9.72c.696 0 1.248-.6 1.248-1.272A1.24 1.24 0 009.336 7.2c-.72 0-1.272.552-1.272 1.248zm8.496 8.76a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default NanoXFoldedMedium;