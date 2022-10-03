import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F3BA2F";

function BNB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M9.087 10.803L12 7.89l2.915 2.915L16.61 9.11 12 4.5 7.392 9.108l1.695 1.695zM4.5 12l1.695-1.695L7.89 12l-1.695 1.695L4.5 12zm4.587 1.197L12 16.11l2.915-2.915 1.695 1.695L12 19.5l-4.608-4.608-.002-.002 1.697-1.693zM16.11 12l1.695-1.695L19.5 12l-1.695 1.695L16.11 12zm-2.391-.002h.002V12L12 13.72l-1.718-1.717-.003-.003.003-.002.3-.302.147-.146L12 10.28 13.72 12l-.001-.002z"  /></Svg>;
}

BNB.DefaultColor = DefaultColor;
export default BNB;