import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#ff2d55";
function MANA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M9.595 8.65L4.31 14.991A8.248 8.248 0 0112 3.75 8.25 8.25 0 0120.25 12a8.23 8.23 0 01-2.912 6.29H6.662c-.467-.4-.89-.85-1.262-1.34h9.422v-3.572l2.973 3.572h.805l-3.782-4.537-1.044 1.253zm5.224-1.6a2.063 2.063 0 000 4.125 2.064 2.064 0 000-4.125M9.596 5.557a1.032 1.032 0 10-.055 2.063 1.032 1.032 0 00.055-2.063M7.492 18.909h9.017A8.23 8.23 0 0112 20.25a8.23 8.23 0 01-4.508-1.341m5.882-4.76l-1.82 2.182H4.98a8.3 8.3 0 01-.668-1.34h5.285V9.615z" /></Svg>;
}
MANA.DefaultColor = DefaultColor;
export default MANA;