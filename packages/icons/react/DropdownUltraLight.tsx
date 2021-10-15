import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropdownUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 14.964l5.328-5.352-.576-.576L12 13.764 7.248 9.036l-.576.576L12 14.964z"  /></Svg>;
}

export default DropdownUltraLight;