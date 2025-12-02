import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#005b9f";
function TYC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M12 12.1l3.7-1.4.2-.1.8-1.5-2.8 1.1-1.9.8-3.3-1.3-1.4-.6.8 1.5.1.1z" /><Path  d="M12 9.2L6.1 6.9l.8 1.4 5.1 2 5.1-2 .8-1.4zm.3 7.9l.8-.3.8-4.8-1.6.7zm-1.4-.3l.8.3v-4.4l-1.6-.7z" /></Svg>;
}
TYC.DefaultColor = DefaultColor;
export default TYC;