import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronLeftMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.22 19.728L9.516 12l7.704-7.728-1.344-1.344L6.78 12l9.096 9.072 1.344-1.344z"  /></Svg>;
}

export default ChevronLeftMedium;