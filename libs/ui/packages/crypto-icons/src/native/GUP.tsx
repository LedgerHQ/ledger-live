import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#37DCD8";

function GUP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.993 9.509L9.905 7.406A24.428 24.428 0 0112 4.5c.768.912 1.467 1.88 2.093 2.894l-2.1 2.115zm4.288 2.107c.59 1.652 1.454 3.303.63 4.889a5.628 5.628 0 01-2.334 2.351c-2.714 1.44-6.074.383-7.504-2.351-.832-1.585.138-3.367.728-5.018.54-1.217 1.087-2.34 1.708-3.418l2.483 2.5 2.497-2.513c.656 1.135 1.223 2.304 1.792 3.561z"  /></Svg>;
}

GUP.DefaultColor = DefaultColor;
export default GUP;