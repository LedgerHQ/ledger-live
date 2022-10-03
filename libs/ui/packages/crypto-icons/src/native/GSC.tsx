import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#FF0060";

function GSC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.86 9.093H12a2.907 2.907 0 102.72 3.918H12a.767.767 0 01-.768-.767v-.093a.767.767 0 01.768-.767h4.535c.033.211.049.425.046.639A4.58 4.58 0 1112 7.419l.14-.024c.03.014.06.021.093.024h4.07c2.22 0 3.127-1.186 3.127-2.86H12a7.443 7.443 0 107.442 7.477v-2.35a.58.58 0 00-.581-.593z"  /></Svg>;
}

GSC.DefaultColor = DefaultColor;
export default GSC;