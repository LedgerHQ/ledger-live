import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4FA784";

function XPA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M18.43 8.884l-6.082-1.743-2.08 3.544L7.85 7.882l1.095-.14 1.129 1.326 1.252-2.22-5.512-1.58a.44.44 0 00-.552.525L7.705 15.6l2.623-4.416 2.416 2.803-1.095.14-1.128-1.325-2.482 4.137.367 1.478a.443.443 0 00.735.21l9.473-9.007a.435.435 0 00-.183-.736z"  /></Svg>;
}

XPA.DefaultColor = DefaultColor;
export default XPA;