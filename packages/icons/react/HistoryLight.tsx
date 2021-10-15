import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HistoryLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c4.968 0 9.12-4.128 9.12-9.12C21.12 7.128 16.968 3 12 3 8.928 3 6.264 4.56 4.632 6.984c.024-.696.024-1.416.024-2.088V2.76h-1.08v6.144h5.496v-1.08H7.464c-.672 0-1.392.024-2.088.048C6.768 5.664 9.192 4.2 12 4.2c4.32 0 7.92 3.576 7.92 7.92 0 4.32-3.6 7.92-7.92 7.92-4.344 0-7.92-3.6-7.92-7.92h-1.2c0 4.992 4.128 9.12 9.12 9.12zm-.6-9.12a.69.69 0 00.168.432l3.456 3.456.864-.864L12.6 11.88V6.6h-1.2v5.52z"  /></Svg>;
}

export default HistoryLight;