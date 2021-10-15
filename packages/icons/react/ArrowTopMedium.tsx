import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowTopMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.088 5.844v15.528h1.824V5.844c.384.432.792.864 1.176 1.248l3.36 3.384 1.176-1.2L12 2.628 5.376 9.276l1.176 1.2 3.36-3.384c.384-.384.792-.816 1.176-1.248z"  /></Svg>;
}

export default ArrowTopMedium;