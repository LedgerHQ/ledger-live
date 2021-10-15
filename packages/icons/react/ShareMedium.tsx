import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShareMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 20.64h16.8v-9.36h-4.08v1.92h2.16v5.52H5.52V13.2h2.16v-1.92H3.6v9.36zM7.656 7.704l1.2 1.176 1.056-1.056c.384-.384.792-.816 1.176-1.248v9.744h1.824V6.528c.408.456.792.888 1.2 1.296l1.08 1.056 1.176-1.176L12 3.36 7.656 7.704z"  /></Svg>;
}

export default ShareMedium;