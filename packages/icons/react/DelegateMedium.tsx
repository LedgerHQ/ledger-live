import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DelegateMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 12.444v8.4h1.92v-8.4c0-2.352 1.656-4.032 3.984-4.032h8.112c-.456.408-.888.792-1.296 1.2l-1.056 1.08 1.176 1.176L20.592 7.5l-4.344-4.344-1.176 1.2 1.056 1.056c.384.384.816.792 1.248 1.176H9.312c-3.264 0-5.904 2.664-5.904 5.856z"  /></Svg>;
}

export default DelegateMedium;