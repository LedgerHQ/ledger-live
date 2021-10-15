import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropupThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 9.228l5.208 5.208-.336.336L12 9.9l-4.872 4.872-.336-.336L12 9.228z"  /></Svg>;
}

export default DropupThin;