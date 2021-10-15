import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ReverseLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c4.992 0 9.12-4.128 9.12-9.12C21.12 7.128 16.992 3 12 3 8.952 3 6.264 4.56 4.632 6.984c.024-.72.024-1.464.024-2.136V2.76h-1.08v6.144H9.72v-1.08H7.632c-.744 0-1.536 0-2.256.024C6.792 5.664 9.216 4.2 12 4.2c4.344 0 7.92 3.576 7.92 7.92 0 4.32-3.6 7.92-7.92 7.92-4.344 0-7.92-3.6-7.92-7.92h-1.2c0 4.992 4.128 9.12 9.12 9.12z"  /></Svg>;
}

export default ReverseLight;