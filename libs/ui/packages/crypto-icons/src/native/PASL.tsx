import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00ACFF";

function PASL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M11.31 15.117a.383.383 0 01.501.21.386.386 0 01-.208.502L9.05 16.89l-.34 1.86H6.953l.192-1.07-1.036.43a.38.38 0 01-.501-.209.386.386 0 01.208-.503l1.492-.619.113-.63-2.016.837a.383.383 0 01-.5-.504.386.386 0 01.208-.209l2.47-1.025 1.798-9.99h5.08c3.11-.108 4.665.931 4.665 3.116 0 2.771-2.026 4.915-5.464 4.915H9.705l-.212 1.167 1.115-.463a.381.381 0 01.5.209.386.386 0 01-.208.502l-1.572.654-.115.63 2.097-.871zm-.428-8.285l-.878 4.818h3.913c2.409 0 3.322-1.638 3.322-2.827 0-1.188-.574-1.991-2.491-1.991h-3.865z"  /></Svg>;
}

PASL.DefaultColor = DefaultColor;
export default PASL;