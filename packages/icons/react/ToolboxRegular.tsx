import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ToolboxRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 20.22h18.48V11.1L18.6 8.46h-1.776V5.556c0-1.008-.768-1.776-1.752-1.776H8.928c-.984 0-1.752.768-1.752 1.776V8.46H5.4L2.76 11.1v9.12zm1.536-1.464v-3.312h3.48v1.272h1.488v-1.272h5.472v1.272h1.488v-1.272h3.504v3.312H4.296zm0-4.8V11.7l1.752-1.776h11.904l1.776 1.776v2.256h-3.504v-1.32h-1.488v1.32H9.264v-1.32H7.776v1.32h-3.48zM8.64 8.46V5.604c0-.216.144-.36.36-.36h6c.216 0 .36.144.36.36V8.46H8.64z"  /></Svg>;
}

export default ToolboxRegular;