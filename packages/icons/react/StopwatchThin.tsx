import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StopwatchThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c4.296 0 7.8-3.504 7.8-7.8a7.808 7.808 0 00-2.112-5.328l1.44-1.464-.336-.336-1.464 1.44A7.88 7.88 0 0012.24 5.76V3.12h2.04v-.48H9.72v.48h2.04v2.64c-4.176.12-7.56 3.576-7.56 7.8 0 4.296 3.504 7.8 7.8 7.8zm-7.32-7.8c0-4.032 3.288-7.32 7.32-7.32s7.32 3.288 7.32 7.32-3.288 7.32-7.32 7.32-7.32-3.288-7.32-7.32zm7.08.48c0 .144.096.24.24.24s.24-.096.24-.24V8.16h-.48v5.88z"  /></Svg>;
}

export default StopwatchThin;