import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0576b4";
function CIX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M17.717 13.911l-.794-.497 1.733-.02.036-.02v.019l.715-.008-1.214 1.976-.109-.953-5.523 3.048-2.095-2.797-5.872 3.094v-.705l6.055-3.19 2.094 2.797zm-7.584-.679l-2.295 1.209V6.246h2.295zm6.49.361l-2.295 1.275V6.247h2.295z" /><Path  d="M13.378 15.396l-.492.273-1.803-2.408V7.185h2.295zm-6.49-.455L4.593 16.15V8.248h2.295z" opacity={0.5} /></Svg>;
}
CIX.DefaultColor = DefaultColor;
export default CIX;