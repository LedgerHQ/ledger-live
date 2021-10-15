import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 8.4l1.416 1.464C5.424 7.632 8.376 6.288 12 6.288c3.624 0 6.576 1.344 8.904 3.576L22.32 8.4A14.955 14.955 0 0012 4.248c-4.08 0-7.752 1.68-10.32 4.152zm3.312 3.576l1.344 1.536c1.608-1.392 3.36-2.136 5.664-2.136s4.056.744 5.664 2.136l1.344-1.536A10.665 10.665 0 0012 9.336c-2.712 0-5.16 1.032-7.008 2.64zm3.432 3.84L12 19.752l3.576-3.936A5.461 5.461 0 0012 14.496a5.461 5.461 0 00-3.576 1.32z"  /></Svg>;
}

export default WifiMedium;