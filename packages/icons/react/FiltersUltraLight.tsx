import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiltersUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.784 21.36v-4.968H8.52v-.84H2.16v.84h2.736v4.968h.888zm-.888-7.728h.888V2.64h-.888v10.992zM8.832 8.4h6.36v-.84h-2.76V2.64h-.864v4.92H8.832v.84zm2.736 12.96h.864V10.32h-.864v11.04zm3.912-4.968h2.736v4.968h.888v-4.968h2.736v-.84h-6.36v.84zm2.736-2.76h.888V2.64h-.888v10.992z"  /></Svg>;
}

export default FiltersUltraLight;