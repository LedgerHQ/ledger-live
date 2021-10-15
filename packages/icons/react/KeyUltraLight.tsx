import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function KeyUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.208 21.108l.624-.624-2.592-2.568 1.848-1.848 2.568 2.568.624-.624-2.568-2.568 4.536-4.536c.768.6 1.728.96 2.784.96a4.486 4.486 0 004.512-4.488 4.486 4.486 0 00-4.512-4.488A4.486 4.486 0 0011.52 7.38c0 1.128.408 2.136 1.08 2.928l-9.144 9.144.624.624 1.536-1.536 2.592 2.568zM12.384 7.38a3.631 3.631 0 013.648-3.648A3.616 3.616 0 0119.68 7.38a3.631 3.631 0 01-3.648 3.648 3.646 3.646 0 01-3.648-3.648z"  /></Svg>;
}

export default KeyUltraLight;