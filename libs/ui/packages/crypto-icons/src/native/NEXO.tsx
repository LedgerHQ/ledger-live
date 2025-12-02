import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1a4199";
function NEXO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M8.047 4.987l8.05 4.643v4.74L3.79 7.263l3.95-2.276a.32.32 0 01.314 0" opacity={0.7} /><Path  d="M16.096 4.893l-4.1 2.37 4.1 2.367z" opacity={0.9} /><Path  d="M16.096 4.893l3.948 2.277a.31.31 0 01.165.276v9.291l-4.113-2.367z" /><Path  d="M20.201 16.737l-3.948 2.275a.33.33 0 01-.315 0L7.89 14.37V9.624z" opacity={0.9} /><Path  d="M3.79 7.263v9.29a.32.32 0 00.165.277l3.95 2.277V9.624z" opacity={0.6} /><Path  d="M7.897 19.106l4.1-2.369-4.1-2.367z" opacity={0.7} /></Svg>;
}
NEXO.DefaultColor = DefaultColor;
export default NEXO;