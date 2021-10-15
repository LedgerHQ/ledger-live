import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingBasketUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.96 20.712h16.08V9.432H16.8V8.04c0-1.128-.312-2.088-.912-2.856C15 4.008 13.536 3.288 12 3.288s-3 .72-3.888 1.896c-.6.768-.912 1.728-.912 2.856v1.392H3.96v11.28zm.84-.816v-9.648h2.4v2.736h.84v-2.736h7.92v2.736h.84v-2.736h2.4v9.648H4.8zM8.04 9.432V7.8c0-2.184 1.584-3.672 3.792-3.672h.36c2.184 0 3.768 1.488 3.768 3.672v1.632H8.04z"  /></Svg>;
}

export default ShoppingBasketUltraLight;