import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MenuBurgerThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M2.88 6.72h18.24v-.48H2.88v.48zm0 11.04h18.24v-.48H2.88v.48zm0-5.52h18.24v-.48H2.88v.48z"  /></Svg>;
}

export default MenuBurgerThin;