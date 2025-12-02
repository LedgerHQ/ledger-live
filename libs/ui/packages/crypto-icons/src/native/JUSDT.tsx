import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function JUSDT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M18.93 4.532H5.318v3.33h5.021v2.188c-4.065.183-7.124.981-7.124 1.937s3.059 1.754 7.124 1.938v7.008h3.57v-7.008c4.069-.183 7.13-.98 7.13-1.938 0-.956-3.061-1.754-7.13-1.937V7.862h5.021zm-8.59 5.728v2.444a20.3 20.3 0 003.57 0V10.26c3.597.16 6.284.796 6.284 1.556 0 .88-3.613 1.595-8.069 1.595s-8.069-.714-8.069-1.595c0-.76 2.686-1.395 6.283-1.556" clipRule="evenodd" /></Svg>;
}
JUSDT.DefaultColor = DefaultColor;
export default JUSDT;