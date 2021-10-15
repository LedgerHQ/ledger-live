import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledFinaThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.768 16.44h.528c.384-3.264 1.752-5.976 3.912-7.8V7.584h-6.36v.48h5.88v.36c-2.232 1.968-3.576 4.776-3.96 8.016zm-5.736 4.44h7.056c4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88H4.032v.48h7.056c4.704 0 8.4 3.696 8.4 8.4 0 4.584-3.696 8.4-8.4 8.4H4.032v.48z"  /></Svg>;
}

export default SevenCircledFinaThin;