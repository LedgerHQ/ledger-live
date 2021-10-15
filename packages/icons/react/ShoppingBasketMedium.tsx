import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingBasketMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 20.88h16.8v-12h-3.6v-.744c0-1.512-.264-2.52-.888-3.288C15 3.696 13.488 3.12 12 3.12s-3 .576-3.912 1.728c-.624.792-.888 1.8-.888 3.288v.744H3.6v12zm1.92-1.8v-8.4H7.2v2.28h1.92v-2.28h5.76v2.28h1.92v-2.28h1.68v8.4H5.52zm3.6-10.2V7.152c0-1.536.576-2.16 2.232-2.16h1.296c1.632 0 2.232.624 2.232 2.16V8.88H9.12z"  /></Svg>;
}

export default ShoppingBasketMedium;