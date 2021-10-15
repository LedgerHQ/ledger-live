import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronTopMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.272 17.22L12 9.516l7.728 7.704 1.344-1.344L12 6.78l-9.072 9.096 1.344 1.344z"  /></Svg>;
}

export default ChevronTopMedium;