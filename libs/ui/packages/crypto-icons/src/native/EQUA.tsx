import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F68922";

function EQUA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12.54 7.559s-3.095.454-3.546 3.894c0 0-.479 3.85 3.456 4.89.272.072.553.108.835.108h.193c.4 0 .785.16 1.068.445.284.285.443.672.443 1.076a1.51 1.51 0 01-1.392 1.516c-1.935.13-4.53-.819-6.215-3.102 0 0-3.3-4.744.296-9.103a7.629 7.629 0 013.208-2.304c1.478-.552 3.642-.908 5.52.567 0 0 2.516 1.948 1.226 5.128 0 0-.903 2.531-3.997 2.726l-.43-.024a1.42 1.42 0 01-1.338-1.057 1.443 1.443 0 01.433-1.453c.25-.22.567-.346.898-.357l.437-.03s1.483-.064 1.354-1.817c0 0-.13-1.558-2.45-1.103"  /></Svg>;
}

EQUA.DefaultColor = DefaultColor;
export default EQUA;