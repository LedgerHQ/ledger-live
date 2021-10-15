import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CubeMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 22.32l8.976-5.232V6.912L12 1.68 3.024 6.912v10.176L12 22.32zm-7.056-6.24V9l6.168 3.528v7.152l-6.168-3.6zm.864-8.664L12 3.792l6.192 3.624L12 10.968 5.808 7.416zm7.104 12.264v-7.152L19.056 9v7.08l-6.144 3.6z"  /></Svg>;
}

export default CubeMedium;