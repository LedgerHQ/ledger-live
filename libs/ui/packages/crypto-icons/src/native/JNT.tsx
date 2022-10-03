import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0050DB";

function JNT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 19.5a2.72 2.72 0 01-1.383-.379l-3.98-2.34a2.838 2.838 0 01-1.387-2.445V9.662a2.848 2.848 0 011.388-2.444l3.979-2.34c.421-.248.9-.378 1.389-.379.484 0 .96.13 1.377.379l3.98 2.34a2.84 2.84 0 011.387 2.445v4.672a2.848 2.848 0 01-1.387 2.445l-3.98 2.34c-.42.248-.897.379-1.383.379zm-2.289-4.822l-.737.75a2.017 2.017 0 001.467.617c1.148-.002 2.08-.948 2.081-2.118v-.638c.315.185.673.282 1.037.281a1.998 1.998 0 001.473-.609l-.736-.75c-.195.2-.46.313-.737.313a1.048 1.048 0 01-1.037-1.056V7.946h-1.037v5.988c0 .585-.464 1.058-1.038 1.058a1.028 1.028 0 01-.736-.314z"  /></Svg>;
}

JNT.DefaultColor = DefaultColor;
export default JNT;