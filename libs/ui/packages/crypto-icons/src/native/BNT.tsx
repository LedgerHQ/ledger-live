import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000D2B";

function BNT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.571 4.714L8.182 6.7l3.389 1.986L15.023 6.7l-3.452-1.985zm.557 10.6v3.972l4.603-2.626v-3.972l-4.603 2.627zm3.453-7.366v3.972l-3.454 1.986V9.934l3.454-1.986zM7.269 11.92l3.453 1.986V9.934L7.269 7.948v3.972zm0 5.38l3.453 1.986v-3.971l-3.453-1.986v3.972z"  /></Svg>;
}

BNT.DefaultColor = DefaultColor;
export default BNT;