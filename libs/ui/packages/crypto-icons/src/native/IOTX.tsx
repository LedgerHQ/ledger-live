import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00d4d5";
function IOTX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M13.892 3.496v4.092l3.553-2.043z" /><Path  d="M17.445 5.545v4.092l3.553-2.049z" opacity={0.9} /><Path  d="M13.892 7.589v4.092l3.553-2.043zm3.553 2.05v4.091l3.553-2.049z" opacity={0.8} /><Path  d="M13.892 11.681v4.093l3.553-2.044z" opacity={0.8} /><Path  d="M17.445 13.73v4.093l3.553-2.049z" /><Path  d="M4.707 7.45v4.093l3.554-2.049z" opacity={0.4} /><Path  d="M9.19 8.972v4.093l3.547-2.044z" opacity={0.2} /><Path  d="M6.556 11.56v4.093l3.552-2.049z" opacity={0.3} /><Path  d="M8.897 14.649v4.093l3.548-2.05z" opacity={0.9} /><Path  d="M13.862 16.41v4.094l3.548-2.05z" opacity={0.7} /><Path  d="M9.781 6.95v4.094l3.548-2.043z" opacity={0.9} /><Path  d="M13.892 3.496v4.092l-3.554-2.043z" opacity={0.8} /><Path  d="M9.781 5.236v4.092l-3.554-2.05zm3.554 2.024v4.094l-3.554-2.05z" opacity={0.6} /><Path  d="M9.173 8.972v4.093L5.62 11.02z" opacity={0.95} /><Path  d="M13.892 11.681v4.093l-3.548-2.044z" opacity={0.6} /><Path  d="M6.556 12.635v4.092l-3.554-2.05z" opacity={0.55} /><Path  d="M20.998 7.589v4.092l-3.553-2.043z" /><Path  d="M17.445 9.638v4.092l-3.553-2.049z" opacity={0.95} /><Path  d="M20.998 11.681v4.093l-3.553-2.044z" opacity={0.9} /><Path  d="M17.445 13.73v4.093l-3.553-2.049z" opacity={0.7} /><Path  d="M13.105 15.436v4.093l-3.553-2.044z" opacity={0.4} /><Path  d="M17.445 5.545v4.092l-3.553-2.049z" /></Svg>;
}
IOTX.DefaultColor = DefaultColor;
export default IOTX;