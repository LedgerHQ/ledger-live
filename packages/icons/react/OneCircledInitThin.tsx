import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledInitThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.512 11.904v4.56h.48v-8.88H12.72l-3.264 3.048v.648l3.456-3.216h.6v3.84zM4.032 12c0 4.968 3.912 8.88 8.88 8.88h7.056v-.48h-7.056c-4.704 0-8.4-3.696-8.4-8.4 0-4.584 3.696-8.4 8.4-8.4h7.056v-.48h-7.056c-4.968 0-8.88 4.032-8.88 8.88z"  /></Svg>;
}

export default OneCircledInitThin;