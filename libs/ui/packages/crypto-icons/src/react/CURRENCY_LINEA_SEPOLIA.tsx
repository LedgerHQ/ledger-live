import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#141414";
function CURRENCY_LINEA_SEPOLIA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" strokeMiterlimit={10} fill={color}><path  d="M16.523 19.14H5.158V7.125h2.6v9.685h8.765v2.328m-.002-9.685a2.324 2.324 0 002.32-2.327 2.323 2.323 0 00-2.32-2.327 2.323 2.323 0 00-2.32 2.327 2.323 2.323 0 002.32 2.327" /></Svg>;
}
CURRENCY_LINEA_SEPOLIA.DefaultColor = DefaultColor;
export default CURRENCY_LINEA_SEPOLIA;