import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#82be00";
function VET({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M18.75 5.25h-1.205a.76.76 0 00-.691.477l-3.168 7.239-.003-.008-.844 1.928.003.008L12 16.82 7.783 7.18h1.203c.295 0 .563.186.691.478l2.752 6.253.844-1.929-2.223-5.048C10.6 5.905 9.651 5.25 8.61 5.25H5.25l.842 1.932h.003l5.06 11.568h1.687z" /></Svg>;
}
VET.DefaultColor = DefaultColor;
export default VET;