import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0cf";
function EMC2({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillOpacity={0.4} d="M5.92 14.37h3.298l-1.42 2.88H4.5zm1.88-3.81h3.298l-1.416 2.872h-3.3zm1.879-3.81h3.298L11.56 9.624H8.263z" /><Path  fillOpacity={0.6} d="M9.208 14.37h3.298l-1.42 2.879H7.787zm1.88-3.81h3.297l-1.416 2.871H9.671zm1.878-3.81h3.299l-1.417 2.872H11.55z" /><Path  d="M12.443 14.37h3.298l-1.42 2.879h-3.298zm1.88-3.81h3.298l-1.416 2.871h-3.299zm1.879-3.81H19.5l-1.417 2.872h-3.297z" /></Svg>;
}
EMC2.DefaultColor = DefaultColor;
export default EMC2;