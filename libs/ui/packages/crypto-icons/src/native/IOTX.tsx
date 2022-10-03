import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00D4D5";

function IOTX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M13.892 3.496v4.092l3.553-2.043-3.553-2.05z"  /><Path opacity={0.9} d="M17.445 5.545v4.092l3.553-2.049-3.553-2.043z"  /><Path opacity={0.8} d="M13.892 7.588v4.093l3.553-2.043-3.553-2.05zm3.553 2.05v4.092l3.553-2.049-3.553-2.043z"  /><Path opacity={0.8} d="M13.892 11.681v4.093l3.553-2.044-3.553-2.049z"  /><Path d="M17.445 13.73v4.093l3.553-2.049-3.553-2.044z"  /><Path opacity={0.4} d="M4.707 7.45v4.093l3.554-2.049L4.707 7.45z"  /><Path opacity={0.2} d="M9.19 8.972v4.093l3.547-2.044L9.19 8.972z"  /><Path opacity={0.3} d="M6.556 11.56v4.093l3.552-2.049-3.552-2.044z"  /><Path opacity={0.9} d="M8.897 14.649v4.093l3.548-2.05-3.548-2.043z"  /><Path opacity={0.7} d="M13.862 16.41v4.094l3.548-2.05-3.548-2.043z"  /><Path opacity={0.9} d="M9.781 6.95v4.094l3.548-2.043-3.548-2.05z"  /><Path opacity={0.8} d="M13.892 3.496v4.092l-3.554-2.043 3.554-2.05z"  /><Path opacity={0.6} d="M9.781 5.236v4.092l-3.554-2.05 3.554-2.042zM13.335 7.26v4.094l-3.554-2.05 3.554-2.043z"  /><Path opacity={0.95} d="M9.173 8.972v4.093L5.62 11.02l3.553-2.049z"  /><Path opacity={0.6} d="M13.892 11.681v4.093l-3.548-2.044 3.548-2.049z"  /><Path opacity={0.55} d="M6.556 12.634v4.093l-3.554-2.05 3.554-2.043z"  /><Path d="M20.998 7.588v4.093l-3.553-2.043 3.553-2.05z"  /><Path opacity={0.95} d="M17.445 9.638v4.092l-3.553-2.049 3.553-2.043z"  /><Path opacity={0.9} d="M20.998 11.681v4.093l-3.553-2.044 3.553-2.049z"  /><Path opacity={0.7} d="M17.445 13.73v4.093l-3.553-2.049 3.553-2.044z"  /><Path opacity={0.4} d="M13.105 15.436v4.093l-3.553-2.044 3.553-2.05z"  /><Path d="M17.445 5.545v4.092l-3.553-2.049 3.553-2.043z"  /></Svg>;
}

IOTX.DefaultColor = DefaultColor;
export default IOTX;