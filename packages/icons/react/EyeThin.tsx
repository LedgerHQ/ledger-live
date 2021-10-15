import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 18.984c3.624 0 7.512-3 9.36-6.984-1.848-3.984-5.736-6.984-9.36-6.984-3.624 0-7.512 3-9.36 6.984 1.848 3.984 5.736 6.984 9.36 6.984zM3.168 12C4.992 8.232 8.592 5.496 12 5.496c3.408 0 7.008 2.736 8.832 6.504-1.824 3.768-5.424 6.504-8.832 6.504-3.408 0-7.008-2.736-8.832-6.504zm5.712 0A3.114 3.114 0 0012 15.12 3.114 3.114 0 0015.12 12 3.114 3.114 0 0012 8.88 3.114 3.114 0 008.88 12zm.48 0A2.632 2.632 0 0112 9.36 2.632 2.632 0 0114.64 12 2.632 2.632 0 0112 14.64 2.632 2.632 0 019.36 12z"  /></Svg>;
}

export default EyeThin;