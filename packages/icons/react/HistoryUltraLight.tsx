import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HistoryUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.18c4.92 0 9-4.08 9-9s-4.08-9-9-9c-3.24 0-6.048 1.776-7.656 4.44.024-.768.024-1.584.024-2.352V2.82H3.6v6.144h5.448v-.792H7.104c-.72 0-1.464.024-2.184.024C6.36 5.724 8.976 4.02 12 4.02c4.464 0 8.16 3.696 8.16 8.16s-3.696 8.16-8.16 8.16-8.16-3.696-8.16-8.16H3c0 4.92 4.08 9 9 9zm-.408-9c0 .12.024.216.12.288l3.456 3.456.576-.576-3.312-3.336V6.66h-.84v5.52z"  /></Svg>;
}

export default HistoryUltraLight;