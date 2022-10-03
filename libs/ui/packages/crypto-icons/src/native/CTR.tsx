import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";

function CTR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-1.16a7.09 7.09 0 100-14.18 7.09 7.09 0 000 14.18zm.054-2.184c-2.698 0-4.87-2.063-4.87-4.879V12c0-2.75 2.118-4.905 4.978-4.905 1.929 0 3.17.809 4.007 1.967l-1.97 1.523c-.54-.674-1.16-1.105-2.064-1.105-1.322 0-2.253 1.118-2.253 2.493V12c0 1.415.93 2.52 2.253 2.52.985 0 1.565-.457 2.132-1.145l1.97 1.402c-.891 1.226-2.092 2.129-4.183 2.129z"  /><Path fillRule="evenodd" clipRule="evenodd" d="M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-1.16a7.09 7.09 0 100-14.18 7.09 7.09 0 000 14.18zm.054-2.184c-2.698 0-4.87-2.063-4.87-4.879V12c0-2.75 2.118-4.905 4.978-4.905 1.929 0 3.17.809 4.007 1.967l-1.97 1.523c-.54-.674-1.16-1.105-2.064-1.105-1.322 0-2.253 1.118-2.253 2.493V12c0 1.415.93 2.52 2.253 2.52.985 0 1.565-.457 2.132-1.145l1.97 1.402c-.891 1.226-2.092 2.129-4.183 2.129z"  /></Svg>;
}

CTR.DefaultColor = DefaultColor;
export default CTR;