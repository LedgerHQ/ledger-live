import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#EAC749";

function JPY({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M13.161 13.658v1.409h3.797v1.716h-3.797v1.967h-2.322v-1.967H7.042v-1.716h3.797v-1.409H7.042v-1.716h3.128L5.625 5.25h2.814l3.6 5.65 3.6-5.65h2.736l-4.565 6.692h3.148v1.716h-3.797z"  /></Svg>;
}

JPY.DefaultColor = DefaultColor;
export default JPY;