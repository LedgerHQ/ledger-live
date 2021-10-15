import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoinLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.608 22.08h2.88c3.744 0 6.576-4.632 6.576-10.08S17.232 1.92 13.488 1.92h-2.88C6.744 1.92 3.936 6.576 3.936 12s2.808 10.08 6.672 10.08zM5.136 12c0-4.896 2.448-8.88 5.472-8.88 2.928 0 5.424 3.984 5.424 8.88 0 4.896-2.496 8.88-5.424 8.88-3.024 0-5.472-3.984-5.472-8.88zm8.352 8.88C15.6 19.248 17.04 15.84 17.04 12c0-3.84-1.44-7.248-3.552-8.88 2.952 0 5.376 3.984 5.376 8.88 0 4.896-2.424 8.88-5.376 8.88z"  /></Svg>;
}

export default CoinLight;