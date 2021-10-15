import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChristmasUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.544 21.12h.912v-2.952h8.4L16.848 12.6h1.968L12 2.88 5.184 12.6h1.992l-4.032 5.568h8.4v2.952zm-6.816-3.744l4.032-5.592H6.744L12 4.296l5.256 7.488h-1.992l4.008 5.592H4.728z"  /></Svg>;
}

export default ChristmasUltraLight;