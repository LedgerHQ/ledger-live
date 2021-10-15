import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowRightMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.724 18.624L21.372 12l-6.648-6.624-1.2 1.176 3.384 3.36c.384.384.816.792 1.248 1.176H2.628v1.824h15.528c-.432.384-.864.792-1.248 1.176l-3.384 3.36 1.2 1.176z"  /></Svg>;
}

export default ArrowRightMedium;