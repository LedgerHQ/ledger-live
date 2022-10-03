import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#C91111";

function DRGN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path opacity={0.6} d="M7.05 15.585h2.113L9.11 10.09l7.871 9.992-.025-11.799h-2.08l.054 5.55L7.053 3.816l-.003 11.77z"  /><path d="M7.05 7.464l.012-3.638 9.887 12.564.041 3.706L7.05 7.464z"  /></Svg>;
}

DRGN.DefaultColor = DefaultColor;
export default DRGN;