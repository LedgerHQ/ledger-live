import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MenuBurgerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.44 7.44h13.92V5.52H7.44v1.92zm-4.8 11.28h18.72v-2.4H2.64v2.4zm0-5.52h18.72v-2.4H2.64v2.4zm0-5.52h18.72v-2.4H2.64v2.4zm4.8 10.8h13.92v-1.92H7.44v1.92zm0-5.52h13.92v-1.92H7.44v1.92z"  /></Svg>;
}

export default MenuBurgerMedium;