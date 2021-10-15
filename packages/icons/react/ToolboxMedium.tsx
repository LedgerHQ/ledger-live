import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ToolboxMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 20.4h18.72v-9.24L18.6 8.4h-1.776V5.376c0-1.008-.768-1.776-1.752-1.776H8.928c-.984 0-1.752.768-1.752 1.776V8.4H5.4l-2.76 2.76v9.24zm1.872-1.8v-2.952h3.12v1.128h1.8v-1.128h5.16v1.128h1.8v-1.128h3.096V18.6H4.512zm0-4.752V11.88l1.68-1.68h11.616l1.68 1.68v1.968h-3.096v-1.152h-1.8v1.152h-5.16v-1.152h-1.8v1.152h-3.12zM8.976 8.4V5.448c0-.024.024-.048.048-.048h5.952c.024 0 .048.024.048.048V8.4H8.976z"  /></Svg>;
}

export default ToolboxMedium;