import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingCartRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.996 17.328v-1.464H8.964l-.384-2.016h11.28l1.992-9-15.048-.024-.408-2.016H2.148v1.488H5.1l2.568 13.032h11.328zM7.092 6.312h12.84l-1.32 6.072H8.292l-1.2-6.072zm.144 13.56c0 .696.576 1.32 1.32 1.32.696 0 1.296-.624 1.296-1.32 0-.72-.6-1.296-1.296-1.296-.744 0-1.32.576-1.32 1.296zm9.504 0c0 .696.576 1.32 1.32 1.32.72 0 1.296-.624 1.296-1.32a1.29 1.29 0 00-1.296-1.296c-.744 0-1.32.576-1.32 1.296z"  /></Svg>;
}

export default ShoppingCartRegular;