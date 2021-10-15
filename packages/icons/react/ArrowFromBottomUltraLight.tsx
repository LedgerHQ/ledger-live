import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowFromBottomUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.592 4.548V16.98h.816V4.548c.768.768 1.56 1.56 2.304 2.328l2.232 2.232.552-.552L12 3.06 6.504 8.556l.552.552 2.232-2.232 2.304-2.328zM3.6 20.94h16.8v-.84H3.6v.84z"  /></Svg>;
}

export default ArrowFromBottomUltraLight;