import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function CURRENCY_BOBA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" strokeMiterlimit={10} fill={color}><Path d="M9.127 15.372a.66.66 0 01-.652-.55L7.428 8.674l-.79-4.643a.66.66 0 111.298-.224l1.837 10.791a.66.66 0 01-.54.763c-.03.01-.07.01-.106.01" /><Path d="M12.2 10.394a5.13 5.13 0 00-2.84.855l.225 1.308a3.98 3.98 0 012.621-.982 4 4 0 013.996 3.995 4 4 0 01-3.996 3.996 4 4 0 01-3.904-4.851l-.356-2.082a5.16 5.16 0 00-.916 2.937 5.18 5.18 0 005.17 5.171 5.18 5.18 0 005.172-5.17 5.18 5.18 0 00-2.863-4.633 5.1 5.1 0 00-2.308-.544" /><Path fillOpacity={0.6} d="M11.219 17.881a.702.702 0 111.404 0 .702.702 0 01-1.404 0m2.198-.819a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-1.73-1.512a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-2.184.717a.702.702 0 111.405 0 .702.702 0 01-1.405 0m4.367-1.44a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-1.71-1.608a.702.702 0 111.405 0 .702.702 0 01-1.405 0m-2.209.819a.702.702 0 111.405 0 .702.702 0 01-1.405 0" /></Svg>;
}
CURRENCY_BOBA.DefaultColor = DefaultColor;
export default CURRENCY_BOBA;