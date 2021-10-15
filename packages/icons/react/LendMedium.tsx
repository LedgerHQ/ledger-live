import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LendMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.628 13.344v1.824c6.864-.864 12.672-4.296 17.136-9.24-.048.6-.048 1.176-.048 1.752v1.608h1.656l-.024-6.168h-6.144V4.8h1.512c.528 0 1.104 0 1.68-.048-4.2 4.632-9.432 7.752-15.768 8.592zm0 7.536h2.04v-2.928h-2.04v2.928zm4.176 0h2.04v-4.272h-2.04v4.272zm4.176 0h2.04v-5.688h-2.04v5.688zm4.176 0h2.04v-7.056h-2.04v7.056zm4.152 0h2.04v-8.4h-2.04v8.4z"  /></Svg>;
}

export default LendMedium;