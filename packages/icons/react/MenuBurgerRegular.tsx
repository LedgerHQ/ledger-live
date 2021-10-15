import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MenuBurgerRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.7 7.248h18.6v-1.56H2.7v1.56zm0 11.04h18.6v-1.56H2.7v1.56zm0-5.52h18.6v-1.56H2.7v1.56z"  /></Svg>;
}

export default MenuBurgerRegular;