import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function CURRENCY_ZKSYNC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" strokeMiterlimit={10} fill={color}><Path d="M2.678 12l5.327-5.327v2.664h5.327l-5.327 3.995v3.995zm18.644 0l-5.327 5.327v-2.664h-5.327l5.327-3.995V6.673z" /></Svg>;
}
CURRENCY_ZKSYNC.DefaultColor = DefaultColor;
export default CURRENCY_ZKSYNC;