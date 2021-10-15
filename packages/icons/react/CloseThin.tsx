import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloseThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.728 19.392L12.336 12l7.392-7.392-.336-.336L12 11.664 4.608 4.272l-.336.336L11.664 12l-7.392 7.392.336.336L12 12.336l7.392 7.392.336-.336z"  /></Svg>;
}

export default CloseThin;