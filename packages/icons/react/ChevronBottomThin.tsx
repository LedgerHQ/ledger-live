import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronBottomThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.768 7.548l-.336.336L12 16.452l8.568-8.568-.336-.336L12 15.78 3.768 7.548z"  /></Svg>;
}

export default ChevronBottomThin;