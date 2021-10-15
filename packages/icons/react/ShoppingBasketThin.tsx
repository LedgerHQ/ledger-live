import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingBasketThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.08 20.652h15.84V9.612H16.8V8.004a4.5 4.5 0 00-.912-2.712A4.91 4.91 0 0012 3.348c-1.56 0-3 .768-3.888 1.944A4.5 4.5 0 007.2 8.004v1.608H4.08v11.04zm.48-.48v-10.08H7.2v2.904h.48v-2.904h8.64v2.904h.48v-2.904h2.64v10.08H4.56zm3.12-10.56V8.004c0-2.376 1.92-4.176 4.296-4.176h.048c2.376 0 4.296 1.8 4.296 4.176v1.608H7.68z"  /></Svg>;
}

export default ShoppingBasketThin;