import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1aab9b";
function MKR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M5.669 15.867V9.833l4.575 3.444v2.59h1.169v-2.832a.68.68 0 00-.273-.544L5.591 8.314a.682.682 0 00-1.091.543v7.01zm12.655 0V9.833l-4.576 3.444v2.59H12.58v-2.832c0-.215.1-.416.271-.544l5.55-4.177a.682.682 0 011.092.544v7.01z" /></Svg>;
}
MKR.DefaultColor = DefaultColor;
export default MKR;