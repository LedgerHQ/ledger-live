import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.232 8.58l.336.336c2.4-2.328 5.64-3.792 9.432-3.792 3.792 0 7.032 1.464 9.432 3.792l.336-.336C19.296 6.18 15.912 4.644 12 4.644c-3.912 0-7.296 1.536-9.768 3.936zm2.952 3.216l.312.36C7.272 10.644 9.432 9.732 12 9.732c2.568 0 4.728.912 6.48 2.448l.336-.384c-1.824-1.56-4.152-2.544-6.816-2.544-2.664 0-4.992.984-6.816 2.544zm2.928 3.264l.312.36A5.461 5.461 0 0112 14.1c1.392 0 2.616.504 3.576 1.32l.288-.384A5.96 5.96 0 0012 13.62a5.965 5.965 0 00-3.888 1.44zm2.64 2.928L12 19.356l1.248-1.368c-.312-.288-.744-.456-1.248-.456s-.936.168-1.248.456z"  /></Svg>;
}

export default WifiThin;