import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HistoryThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.12c4.848 0 8.88-4.032 8.88-8.88 0-4.848-4.032-8.88-8.88-8.88-3.408 0-6.384 1.992-7.92 4.896V2.88H3.6v6.144h5.424v-.48H4.488C5.928 5.76 8.76 3.84 12 3.84c4.584 0 8.4 3.816 8.4 8.4 0 4.584-3.816 8.4-8.4 8.4-4.584 0-8.4-3.816-8.4-8.4h-.48c0 4.848 4.032 8.88 8.88 8.88zm-.24-8.88c0 .072.024.12.072.168l3.456 3.456.336-.336-3.384-3.384V6.72h-.48v5.52z"  /></Svg>;
}

export default HistoryThin;