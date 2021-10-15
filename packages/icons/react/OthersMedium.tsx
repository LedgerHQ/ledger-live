import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OthersMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.424 13.488H20.4v-2.976h-2.976v2.976zm-13.824 0h2.976v-2.976H3.6v2.976zm6.912 0h2.976v-2.976h-2.976v2.976z"  /></Svg>;
}

export default OthersMedium;