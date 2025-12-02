import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fefffe";
function EOP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M11.036 21L7.025 10.303l-1.62 7.38zM12.09 3.128l-4.397 5.35 4.397 11.237 4.423-11.238zM13.17 21l4.012-10.697 1.594 7.38z" /><Path  d="M10.946 20.936L6.934 10.239l-1.62 7.38zM12 3.064l-4.397 5.35L12 19.65l4.423-11.237zm1.08 17.872l4.012-10.697 1.594 7.38z" /></Svg>;
}
EOP.DefaultColor = DefaultColor;
export default EOP;