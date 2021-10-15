import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowRightLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.748 18.624L21.372 12l-6.624-6.624-.768.744 3.264 3.264c.672.672 1.368 1.368 2.064 2.04H2.628v1.152h16.68c-.696.672-1.392 1.344-2.064 2.016l-3.264 3.264.768.768z"  /></Svg>;
}

export default ArrowRightLight;