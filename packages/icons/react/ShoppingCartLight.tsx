import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingCartLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.876 16.968V15.84H8.796l-.432-2.136h11.52l1.968-8.88L6.612 4.8l-.36-1.848H2.148v1.152h3.096l2.544 12.864h11.088zM6.828 5.952h13.536l-1.44 6.624H8.148l-1.32-6.624zM7.26 19.68c0 .744.6 1.368 1.344 1.368.744 0 1.344-.624 1.344-1.368 0-.72-.6-1.344-1.344-1.344-.744 0-1.344.624-1.344 1.344zm9.336 0c0 .744.6 1.368 1.344 1.368.744 0 1.344-.624 1.344-1.368 0-.72-.6-1.344-1.344-1.344-.744 0-1.344.624-1.344 1.344z"  /></Svg>;
}

export default ShoppingCartLight;