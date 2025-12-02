import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#5546ff";
function CURRENCY_STACKS({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M14.309 14.11l2.511 3.8h-1.879l-2.945-4.465-2.95 4.465H7.18l2.511-3.789H6.09V12.68h11.82v1.43zm3.601-4.27v1.45H6.09V9.84h3.53L7.14 6.09h1.875l2.98 4.527 2.988-4.527h1.875l-2.48 3.75zm0 0" /></Svg>;
}
CURRENCY_STACKS.DefaultColor = DefaultColor;
export default CURRENCY_STACKS;