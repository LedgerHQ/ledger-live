import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ReverseUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.18c4.92 0 9-4.08 9-9s-4.08-9-9-9c-3.216 0-6.048 1.8-7.632 4.464V2.82H3.6v6.144h6.144v-.792H7.368c-.816 0-1.656.024-2.424.024C6.36 5.7 9.024 4.02 12 4.02c4.464 0 8.16 3.696 8.16 8.16s-3.696 8.16-8.16 8.16-8.16-3.696-8.16-8.16H3c0 4.92 4.08 9 9 9z"  /></Svg>;
}

export default ReverseUltraLight;