import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00aeef";
function KRB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M11.07 11.03q.267-.047.474-.2.207-.152.39-.505l2.72-5.24a1.5 1.5 0 01.386-.425.9.9 0 01.526-.16h1.724l-3.386 6.164q-.225.38-.51.62-.287.237-.638.361.544.14.915.46.368.316.695.889l3.259 6.506h-1.898q-.574 0-.924-.615l-2.671-5.513q-.207-.368-.45-.527a1.26 1.26 0 00-.611-.183v2.798H9.579v-2.81H8.482v6.85H6.376v-15h2.108v6.554H9.58V7.812h1.492z" /></Svg>;
}
KRB.DefaultColor = DefaultColor;
export default KRB;