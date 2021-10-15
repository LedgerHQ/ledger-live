import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingCartUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.768 16.632v-.816H8.616l-.432-2.256H19.92l1.92-8.76-15.408-.024-.336-1.68H2.16v.816h3.264l2.52 12.72h10.824zM6.6 5.592l14.208.024-1.56 7.128H8.016L6.6 5.592zm.672 13.92c0 .744.624 1.392 1.416 1.392.768 0 1.392-.648 1.392-1.392 0-.768-.624-1.392-1.392-1.392-.792 0-1.416.624-1.416 1.392zm.696 0c0-.408.312-.72.72-.72.384 0 .72.312.72.72 0 .384-.336.72-.72.72a.722.722 0 01-.72-.72zm8.472 0c0 .744.624 1.392 1.392 1.392.768 0 1.392-.648 1.392-1.392a1.393 1.393 0 00-2.784 0zm.672 0c0-.408.336-.72.72-.72.408 0 .72.312.72.72 0 .384-.312.72-.72.72a.738.738 0 01-.72-.72z"  /></Svg>;
}

export default ShoppingCartUltraLight;