import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropdownLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 15.156l5.472-5.448-.864-.864L12 13.476 7.392 8.844l-.864.864L12 15.156z"  /></Svg>;
}

export default DropdownLight;