import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnlockThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.024 21.12H21.84V9.6h-9.744V7.848c0-2.712-2.232-4.968-4.968-4.968-2.736 0-4.968 2.256-4.968 4.968v3.312h.48V7.848C2.64 5.4 4.656 3.36 7.128 3.36c2.472 0 4.488 2.04 4.488 4.488V9.6H9.024v11.52zm.48-.48V10.08H21.36v10.56H9.504zm5.688-3.36h.48V13.2h-.48v4.08z"  /></Svg>;
}

export default UnlockThin;