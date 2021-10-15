import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DelegateUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 12.444v8.4h.84v-8.4c0-2.544 1.968-4.536 4.536-4.536h10.344c-.6.576-1.176 1.152-1.752 1.728l-1.68 1.656.552.552L20.592 7.5l-4.344-4.344-.552.552 1.68 1.656c.552.576 1.152 1.152 1.728 1.728H8.784c-2.976 0-5.376 2.424-5.376 5.352z"  /></Svg>;
}

export default DelegateUltraLight;