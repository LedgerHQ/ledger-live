import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LendUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.192 13.944v.84c6.816-.96 12.504-4.824 16.872-10.344v4.848h.768V3.12h-6.144v.768h4.752c-4.248 5.4-9.672 9.12-16.248 10.056zm-.024 6.936h.888v-2.928h-.888v2.928zm4.2 0h.864v-4.272h-.864v4.272zm4.2 0h.864v-5.688h-.864v5.688zm4.2 0h.864v-7.056h-.864v7.056zm4.176 0h.864v-8.4h-.864v8.4z"  /></Svg>;
}

export default LendUltraLight;