import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowFromBottomMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.088 6.096V16.8h1.824V6.072c.384.432.792.864 1.176 1.272l2.232 2.208 1.176-1.176L12 2.88 6.504 8.376l1.2 1.176 2.208-2.208c.384-.384.792-.816 1.176-1.248zM3.6 21.12h16.8V19.2H3.6v1.92z"  /></Svg>;
}

export default ArrowFromBottomMedium;