import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StopwatchLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.72c4.416 0 8.04-3.624 8.04-8.04 0-1.992-.72-3.816-1.944-5.208l1.32-1.296-.912-.912-1.296 1.32a7.742 7.742 0 00-4.608-1.92V3.48h1.92v-1.2H9.48v1.2h1.92v2.184c-4.152.312-7.44 3.792-7.44 8.016 0 4.416 3.624 8.04 8.04 8.04zm-6.84-8.04c0-3.768 3.072-6.84 6.84-6.84s6.84 3.072 6.84 6.84-3.072 6.84-6.84 6.84-6.84-3.072-6.84-6.84zm6.24.48c0 .336.264.6.6.6.336 0 .6-.264.6-.6V8.64h-1.2v5.52z"  /></Svg>;
}

export default StopwatchLight;