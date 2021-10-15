import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledInitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.44 13.536v2.928h1.92v-8.88h-2.232l-2.784 2.568v2.256l2.832-2.592h.336s-.072 1.584-.072 3.72zM4.2 12c0 5.232 4.128 9.36 9.36 9.36h6.24v-1.92h-6.24c-4.176 0-7.44-3.264-7.44-7.44 0-4.056 3.264-7.44 7.44-7.44h6.24V2.64h-6.24C8.304 2.64 4.2 6.912 4.2 12z"  /></Svg>;
}

export default OneCircledInitMedium;