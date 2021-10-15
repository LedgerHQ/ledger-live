import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MenuBurgerUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.82 6.888h18.36v-.84H2.82v.84zm0 11.04h18.36v-.84H2.82v.84zm0-5.52h18.36v-.84H2.82v.84z"  /></Svg>;
}

export default MenuBurgerUltraLight;