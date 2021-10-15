import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ToolboxThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 19.68h17.76v-8.76L18.6 8.64h-1.776V6.096c0-1.008-.768-1.776-1.752-1.776H8.928c-.984 0-1.752.768-1.752 1.776V8.64H5.4l-2.28 2.28v8.76zm.48-.48v-4.44h4.68v1.776h.48V14.76h6.48v1.776h.48V14.76h4.68v4.44H3.6zm0-4.92v-3.168L5.592 9.12h12.816l1.992 1.992v3.168h-4.68v-1.824h-.48v1.824H8.76v-1.824h-.48v1.824H3.6zm4.056-5.64V6.096c0-.816.48-1.296 1.272-1.296h6.144c.792 0 1.272.48 1.272 1.296V8.64H7.656z"  /></Svg>;
}

export default ToolboxThin;