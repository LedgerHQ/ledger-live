import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function AVAX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M8.618 19.91H4.163a.944.944 0 01-.823-1.408L11.195 4.57a.944.944 0 011.644 0l2.354 4.155a.94.94 0 010 .946l-5.757 9.774a.94.94 0 01-.818.465m5.075-1.411l2.646-4.72a.946.946 0 011.646 0l2.673 4.718a.946.946 0 01-.821 1.413h-5.32a.946.946 0 01-.824-1.411" /></Svg>;
}
AVAX.DefaultColor = DefaultColor;
export default AVAX;