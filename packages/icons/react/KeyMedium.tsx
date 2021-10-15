import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function KeyMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.776 21.492l1.44-1.44-2.184-2.16 1.032-1.032 2.16 2.16 1.44-1.44-2.16-2.16 3.912-3.912a5.159 5.159 0 002.592.696c2.808 0 4.968-2.208 4.968-4.848 0-2.64-2.16-4.848-4.968-4.848S11.04 4.716 11.04 7.356c0 1.032.312 1.968.888 2.76L3.024 19.02l1.44 1.44 1.128-1.128 2.184 2.16zM13.08 7.356a2.91 2.91 0 012.928-2.928 2.91 2.91 0 012.928 2.928 2.91 2.91 0 01-2.928 2.928 2.91 2.91 0 01-2.928-2.928z"  /></Svg>;
}

export default KeyMedium;