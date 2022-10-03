import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1D9AD7";

function FSN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M21.75 10.659c-.758-.79-2.312-1.452-5.212-1.858a44.92 44.92 0 00-2.752-.299c-.715-.043-1.409-.085-2.08-.085-1.114 1.665-2.165 3.672-3.09 6.085-1.009 2.647-1.912 5.253-2.542 7.623h-.189c.063-2.541.483-5.423 1.345-8.413.568-1.942 1.24-3.652 1.996-5.145-3.405.363-5.842 1.409-6.976 2.903.967-2.37 3.845-4.377 8.237-5.081 2.333-3.481 5.085-5.04 7.376-4.356.798.234 1.47.747 2.017 1.473-.063-.043-.127-.086-.21-.107-1.681-.683-3.95.299-6.157 2.733h.105c4.938-.021 7.438 2.072 8.132 4.527zm-6.178 3.202c1.344 0 2.437 1.132 2.437 2.52 0 1.388-1.093 2.52-2.438 2.52-1.344 0-2.437-1.132-2.437-2.52 0-1.409 1.093-2.52 2.438-2.52z"  /></Svg>;
}

FSN.DefaultColor = DefaultColor;
export default FSN;