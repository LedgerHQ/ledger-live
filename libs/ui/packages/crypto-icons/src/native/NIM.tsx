import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function NIM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.96 11.852h0a.29.29 0 010 .295h0l-3.335 5.691v.001a.323.323 0 01-.12.116.35.35 0 01-.17.045h-6.67a.35.35 0 01-.17-.045.324.324 0 01-.12-.116l-3.334-5.691h0a.29.29 0 010-.295h0L8.375 6.16s0 0 0 0a.323.323 0 01.12-.116.35.35 0 01.17-.045h6.67a.35.35 0 01.17.045c.051.03.092.07.12.116 0 0 0 0 0 0l3.334 5.691z" stroke="#F8B425" strokeWidth={2} /></Svg>;
}

NIM.DefaultColor = DefaultColor;
export default NIM;