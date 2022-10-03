import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#FEFFFE";

function EOP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.036 21L7.025 10.303l-1.62 7.38L11.035 21zM12.09 3.128l-4.397 5.35 4.397 11.237 4.423-11.238-4.423-5.349zM13.17 21l4.012-10.697 1.594 7.38L13.17 21z"  /><Path d="M10.945 20.936l-4.01-10.697-1.62 7.38 5.63 3.317zM12 3.064l-4.397 5.35L12 19.65l4.423-11.237L12 3.064zm1.08 17.872l4.012-10.697 1.594 7.38-5.606 3.317z"  /></Svg>;
}

EOP.DefaultColor = DefaultColor;
export default EOP;