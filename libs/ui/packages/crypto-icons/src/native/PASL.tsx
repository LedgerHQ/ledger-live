import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00acff";
function PASL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M11.31 15.117a.383.383 0 01.501.21.386.386 0 01-.208.502L9.05 16.89l-.34 1.86H6.953l.192-1.07-1.036.43a.38.38 0 01-.501-.209.386.386 0 01.208-.503l1.492-.619.113-.63-2.016.837a.383.383 0 01-.5-.504.4.4 0 01.208-.209l2.47-1.025 1.798-9.99h5.08q4.665-.162 4.665 3.116c0 2.771-2.026 4.915-5.464 4.915H9.705l-.212 1.167 1.115-.463a.38.38 0 01.5.209.386.386 0 01-.208.502l-1.572.654-.115.63zm-.428-8.285l-.878 4.818h3.913c2.409 0 3.323-1.638 3.323-2.827 0-1.188-.575-1.991-2.492-1.991z" clipRule="evenodd" /></Svg>;
}
PASL.DefaultColor = DefaultColor;
export default PASL;