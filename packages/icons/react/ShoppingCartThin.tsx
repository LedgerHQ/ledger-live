import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingCartThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.648 16.272v-.48h-10.2l-.456-2.376h11.952l1.896-8.64-15.576-.024-.312-1.512H2.16v.48h3.408l2.496 12.552h10.584zM6.36 5.232l14.88.024-1.68 7.68H7.896L6.36 5.232zm.936 14.088c0 .792.648 1.44 1.44 1.44.792 0 1.44-.648 1.44-1.44 0-.792-.648-1.44-1.44-1.44-.792 0-1.44.648-1.44 1.44zm.48 0c0-.528.432-.96.96-.96s.96.432.96.96-.432.96-.96.96a.963.963 0 01-.96-.96zm8.496 0c0 .792.648 1.44 1.44 1.44.792 0 1.44-.648 1.44-1.44 0-.792-.648-1.44-1.44-1.44-.792 0-1.44.648-1.44 1.44zm.48 0c0-.528.432-.96.96-.96s.96.432.96.96-.432.96-.96.96a.963.963 0 01-.96-.96z"  /></Svg>;
}

export default ShoppingCartThin;