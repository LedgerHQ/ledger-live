import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowTopLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.424 4.692v16.68h1.152V4.692c.672.696 1.368 1.392 2.04 2.064l3.264 3.264.744-.768L12 2.628 5.376 9.252l.768.768 3.264-3.264c.672-.672 1.344-1.368 2.016-2.064z"  /></Svg>;
}

export default ArrowTopLight;