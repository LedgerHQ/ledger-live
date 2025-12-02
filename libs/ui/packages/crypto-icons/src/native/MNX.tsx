import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function MNX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M11.147 20.24C6.99 19.804 3.75 16.28 3.75 12s3.24-7.804 7.397-8.24v2.528A5.775 5.775 0 006.252 12a5.775 5.775 0 004.895 5.712zm1.631-16.49a8.28 8.28 0 017.461 7.378h-2.522a5.775 5.775 0 00-4.938-4.856zm7.472 9.013c-.361 3.967-3.513 7.125-7.472 7.487v-2.522a5.775 5.775 0 004.955-4.965z" clipRule="evenodd" /><Path  fillRule="evenodd" d="M11.147 20.24C6.99 19.804 3.75 16.28 3.75 12s3.24-7.804 7.397-8.24v2.528A5.775 5.775 0 006.252 12a5.775 5.775 0 004.895 5.712zm1.631-16.49a8.28 8.28 0 017.461 7.378h-2.522a5.775 5.775 0 00-4.938-4.856zm7.472 9.013c-.361 3.967-3.513 7.125-7.472 7.487v-2.522a5.775 5.775 0 004.955-4.965z" clipRule="evenodd" /></Svg>;
}
MNX.DefaultColor = DefaultColor;
export default MNX;