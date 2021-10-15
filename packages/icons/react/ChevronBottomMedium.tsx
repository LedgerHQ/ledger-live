import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronBottomMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.272 6.78L2.928 8.124 12 17.22l9.072-9.096-1.344-1.344L12 14.484 4.272 6.78z"  /></Svg>;
}

export default ChevronBottomMedium;