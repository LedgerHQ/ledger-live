import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function SABI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  stroke="#000" strokeWidth={0.48} d="M9.73 3.033H4.391A11.7 11.7 0 0112 .24C18.495.24 23.76 5.505 23.76 12S18.495 23.76 12 23.76c-2.585 0-4.975-.834-6.916-2.248H9.73a1.058 1.058 0 000-2.116H2.856a12 12 0 01-1.118-1.649h11.599a1.058 1.058 0 000-2.116H.81a12 12 0 01-.422-1.755H4.09a1.058 1.058 0 000-2.116H.242c.017-.824.118-1.627.296-2.401h12.826a1.058 1.058 0 000-2.116H1.242q.494-1.116 1.198-2.094h7.29a1.058 1.058 0 000-2.116zm-.152 9.785c0 .584.474 1.058 1.058 1.058h8.728a1.058 1.058 0 000-2.116h-8.728c-.584 0-1.058.473-1.058 1.058zm-2.25-1.058a1.059 1.059 0 10-.001 2.117 1.059 1.059 0 000-2.117zm5.7-8.727a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117zm0 16.363a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117z" /></Svg>;
}
SABI.DefaultColor = DefaultColor;
export default SABI;