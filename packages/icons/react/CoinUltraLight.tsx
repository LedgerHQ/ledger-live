import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoinUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.68 21.96h2.736c3.6 0 6.36-4.56 6.36-9.96 0-5.4-2.76-9.96-6.36-9.96H10.68C6.984 2.04 4.224 6.6 4.224 12c0 5.4 2.76 9.96 6.456 9.96zM5.064 12c0-5.04 2.496-9.12 5.616-9.12 3.024 0 5.568 4.08 5.568 9.12 0 5.016-2.544 9.12-5.568 9.12-3.12 0-5.616-4.104-5.616-9.12zm8.016 9.12c2.328-1.488 3.912-5.04 3.912-9.12 0-4.08-1.584-7.632-3.912-9.12h.336c3.024 0 5.52 4.08 5.52 9.12 0 5.016-2.496 9.12-5.52 9.12h-.336z"  /></Svg>;
}

export default CoinUltraLight;