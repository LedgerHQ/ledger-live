import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledFinaMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.32 13.536v2.928h1.92v-8.88h-2.232l-2.784 2.568v2.256l2.832-2.592h.336s-.072 1.584-.072 3.72zM4.2 21.36h6.24c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36H4.2v1.92h6.24c4.176 0 7.44 3.264 7.44 7.44 0 4.056-3.264 7.44-7.44 7.44H4.2v1.92z"  /></Svg>;
}

export default OneCircledFinaMedium;