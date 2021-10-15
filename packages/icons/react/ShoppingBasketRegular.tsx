import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingBasketRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.72 20.82h16.56V9.06H16.8V8.1c0-1.392-.288-2.376-.888-3.144C15 3.804 13.512 3.18 12 3.18s-3 .624-3.912 1.776c-.6.792-.888 1.776-.888 3.144v.96H3.72v11.76zm1.56-1.464v-8.832H7.2v2.448h1.56v-2.448h6.48v2.448h1.56v-2.448h1.92v8.832H5.28zM8.76 9.06V7.356c0-1.752.912-2.664 2.76-2.664h.984c1.8 0 2.736.912 2.736 2.664V9.06H8.76z"  /></Svg>;
}

export default ShoppingBasketRegular;