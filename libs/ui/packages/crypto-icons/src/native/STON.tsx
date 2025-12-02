import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function STON({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M14.261 16.047a.205.205 0 01.305.095l1.698 4.566c.054.147-.083.293-.24.255l-6.25-1.527a.192.192 0 01-.065-.35z" /><Path  d="M15.357 15.04a.2.2 0 01-.012-.066v-4.602c0-.13-.13-.224-.259-.187l-5.355 1.527c-.13.037-.26-.057-.26-.187V8.55c0-.061.03-.118.08-.155l6.979-5.13a.206.206 0 01.297.059l4.216 7.077c.03.05.035.11.014.165l-3.55 9.243c-.065.17-.315.17-.379-.002zM7.685 3.665a.2.2 0 01.125-.055l6.44-.506c.202-.016.3.231.14.349L8.9 7.481a.2.2 0 01-.179.032L5.106 6.508a.192.192 0 01-.085-.327z" /><Path  d="M4.1 7.52a.202.202 0 01.256-.164l3.832 1.069c.086.024.146.1.146.187v4.326c0 .13.13.223.259.186l5.318-1.52c.13-.036.26.057.26.188v2.747a.2.2 0 01-.087.16l-5.965 3.999a.21.21 0 01-.252-.017l-4.598-4.094a.19.19 0 01-.063-.167z" /></Svg>;
}
STON.DefaultColor = DefaultColor;
export default STON;